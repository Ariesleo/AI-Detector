// Analyzing: staged forensic progress with animated scanner. Runs the real
// API call; stages advance on a timer while the request is in flight.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui";
import { analyzeImage } from "@/lib/api";
import { addToHistory } from "@/lib/storage";
import { getPendingImage, saveReport, setPendingImage } from "@/lib/store";
import { LAYER_META, palette, radius, space, type as t } from "@/lib/theme";

const STAGES = [
  { key: "provenance", label: "Checking cryptographic provenance…" },
  { key: "metadata", label: "Reading metadata fingerprints…" },
  { key: "forensics", label: "Running statistical forensics…" },
  { key: "vision", label: "Visual inspection…" },
  { key: "verdict", label: "Weighing the evidence…" },
] as const;

const MIN_DURATION_MS = 2800;

export default function Analyzing() {
  const router = useRouter();
  const image = getPendingImage();
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, [spin, pulse]);

  useEffect(() => {
    if (!image) {
      router.replace("/(tabs)");
      return;
    }
    let cancelled = false;
    const ticker = setInterval(
      () => setStage((s) => Math.min(s + 1, STAGES.length - 1)),
      MIN_DURATION_MS / STAGES.length
    );

    const started = Date.now();
    (async () => {
      try {
        const report = await analyzeImage(image);
        const wait = Math.max(0, MIN_DURATION_MS - (Date.now() - started));
        await new Promise((r) => setTimeout(r, wait));
        if (cancelled) return;
        saveReport(report, image.uri);
        await addToHistory(report, image.uri);
        setPendingImage(null);
        router.replace({ pathname: "/report/[id]", params: { id: report.report_id } });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(ticker);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  if (error) {
    return (
      <View style={styles.root}>
        <View style={styles.errorIcon}>
          <Ionicons name="cloud-offline" size={34} color={palette.danger} />
        </View>
        <Text style={[t.h1, { textAlign: "center" }]}>Analysis failed</Text>
        <Text style={[t.body, { textAlign: "center" }]}>{error}</Text>
        <Text style={[t.small, { textAlign: "center" }]}>
          Is the backend running and reachable? Check the server address in Settings.
        </Text>
        <View style={{ gap: space.m, width: "100%", maxWidth: 380, marginTop: space.l }}>
          <Button title="Back to Analyze" icon="arrow-back" onPress={() => router.replace("/(tabs)")} />
          <Button title="Open Settings" icon="options" variant="ghost" onPress={() => router.replace("/(tabs)/settings")} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.scanWrap}>
        <Animated.View
          style={[styles.halo, { transform: [{ scale: haloScale }], opacity: haloOpacity }]}
        />
        <Animated.View style={[styles.orbit, { transform: [{ rotate: rotation }] }]}>
          <View style={styles.orbitDot} />
        </Animated.View>
        <View style={styles.thumbFrame}>
          {image && <Image source={{ uri: image.uri }} style={styles.thumb} resizeMode="cover" />}
        </View>
      </View>

      <Text style={[t.h1, { textAlign: "center" }]}>Analyzing</Text>
      <Text style={[t.body, { textAlign: "center", color: palette.accent }]}>
        {STAGES[stage].label}
      </Text>

      <View style={styles.stages}>
        {STAGES.map((s, i) => {
          const meta = s.key in LAYER_META ? LAYER_META[s.key] : null;
          const done = i < stage;
          const active = i === stage;
          return (
            <View key={s.key} style={styles.stageRow}>
              <View
                style={[
                  styles.stageDot,
                  done && { backgroundColor: palette.ok, borderColor: palette.ok },
                  active && { borderColor: palette.accent },
                ]}
              >
                {done && <Ionicons name="checkmark" size={11} color={palette.bg} />}
              </View>
              <Text
                style={[
                  t.small,
                  { fontSize: 13 },
                  done && { color: palette.textDim },
                  active && { color: palette.text, fontWeight: "700" },
                ]}
              >
                {meta?.title ?? "Verdict"}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
    gap: space.m,
  },
  scanWrap: { width: 190, height: 190, alignItems: "center", justifyContent: "center", marginBottom: space.l },
  halo: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: radius.pill,
    backgroundColor: palette.accent,
  },
  orbit: {
    position: "absolute",
    width: 178,
    height: 178,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.strokeBright,
  },
  orbitDot: {
    position: "absolute",
    top: -5,
    alignSelf: "center",
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: palette.accent,
  },
  thumbFrame: {
    width: 140,
    height: 140,
    borderRadius: radius.pill,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: palette.strokeBright,
    backgroundColor: palette.bgRaised,
  },
  thumb: { width: "100%", height: "100%" },
  stages: { marginTop: space.xl, gap: 10, alignSelf: "center" },
  stageRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stageDot: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.stroke,
    alignItems: "center",
    justifyContent: "center",
  },
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: "rgba(248,113,113,0.12)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.s,
  },
});
