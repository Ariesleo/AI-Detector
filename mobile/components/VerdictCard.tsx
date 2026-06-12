// Verdict panel: the report's centerpiece. Animated confidence bar,
// verdict icon, signal tally, plain-language summary.
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { Card, Chip } from "@/components/ui";
import { palette, radius, space, type as t, VERDICTS } from "@/lib/theme";
import type { AnalysisReport } from "@/lib/types";

export function VerdictCard({ report }: { report: AnalysisReport }) {
  const v = VERDICTS[report.verdict];
  const pct = Math.round(report.confidence * 100);
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: pct,
      duration: 900,
      delay: 250,
      useNativeDriver: false,
    }).start();
  }, [pct, fill]);

  const tally = {
    ai: report.evidence.filter((e) => e.direction === "ai").length,
    authentic: report.evidence.filter((e) => e.direction === "authentic").length,
    neutral: report.evidence.filter((e) => e.direction === "neutral").length,
  };

  return (
    <Card tint={v.gradient} style={{ borderColor: v.color + "55" }}>
      <View style={styles.top}>
        <View style={[styles.iconRing, { borderColor: v.color }]}>
          <Ionicons name={v.icon} size={26} color={v.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.verdict, { color: v.color }]}>{v.label}</Text>
          <Text style={t.small}>{v.blurb}</Text>
        </View>
      </View>

      <View style={styles.confRow}>
        <Text style={t.label}>Confidence</Text>
        <Text style={[styles.confPct, { color: v.color }]}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: v.color,
              width: fill.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
            },
          ]}
        />
      </View>

      <View style={styles.tally}>
        {tally.ai > 0 && <Chip label={`${tally.ai} AI signal${tally.ai > 1 ? "s" : ""}`} color="#fb923c" icon="arrow-up" />}
        {tally.authentic > 0 && <Chip label={`${tally.authentic} authentic`} color="#4ade80" icon="arrow-down" />}
        {tally.neutral > 0 && <Chip label={`${tally.neutral} neutral`} color={palette.textDim} icon="remove" />}
        {report.cached && <Chip label="previously analyzed" color={palette.textFaint} icon="time" />}
      </View>

      <Text style={[t.body, { color: palette.text, marginTop: space.m }]}>{report.summary}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", gap: space.m, alignItems: "center" },
  iconRing: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  verdict: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3, marginBottom: 2 },
  confRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: space.l,
    marginBottom: 6,
  },
  confPct: { fontSize: 18, fontWeight: "800" },
  track: {
    height: 9,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.35)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  fill: { height: "100%", borderRadius: radius.pill },
  tally: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: space.m },
});
