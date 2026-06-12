// Home / Analyze: hero, image picker, dropzone-style preview.
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Screen } from "@/components/ui";
import type { PickedImage } from "@/lib/api";
import { hasOnboarded } from "@/lib/storage";
import { setPendingImage } from "@/lib/store";
import { palette, radius, space, type as t } from "@/lib/theme";

export default function Home() {
  const router = useRouter();
  const [image, setImage] = useState<PickedImage | null>(null);

  // First launch → onboarding.
  useFocusEffect(
    useCallback(() => {
      hasOnboarded().then((seen) => {
        if (!seen) router.replace("/onboarding");
      });
    }, [router])
  );

  async function pick(fromCamera: boolean) {
    const fn = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;
    const result = await fn({ mediaTypes: ["images"], quality: 1, exif: false });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setImage({ uri: a.uri, fileName: a.fileName, mimeType: a.mimeType });
    }
  }

  function analyze() {
    if (!image) return;
    setPendingImage(image);
    router.push("/analyzing");
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Ionicons name="scan" size={18} color={palette.accent} />
          </View>
          <Text style={styles.brand}>VERITAS</Text>
        </View>
        <Text style={t.hero}>Is this image real?</Text>
        <Text style={t.body}>
          Five forensic layers. One evidence-based answer.
        </Text>
      </View>

      <Pressable onPress={() => pick(false)}>
        <LinearGradient
          colors={image ? ["transparent", "transparent"] : [palette.accentDim, "rgba(34,211,238,0.02)"]}
          style={[styles.drop, image && styles.dropFilled]}
        >
          {image ? (
            <>
              <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
              <Pressable style={styles.clear} hitSlop={8} onPress={() => setImage(null)}>
                <Ionicons name="close" size={16} color={palette.text} />
              </Pressable>
            </>
          ) : (
            <View style={styles.dropInner}>
              <View style={styles.dropIcon}>
                <Ionicons name="image" size={26} color={palette.accent} />
              </View>
              <Text style={[t.h2, { textAlign: "center" }]}>Drop an image here</Text>
              <Text style={[t.small, { textAlign: "center" }]}>
                JPEG · PNG · WebP · TIFF · HEIC — up to 15 MB
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>

      <View style={styles.actions}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Button title="Library" icon="images" variant="ghost" onPress={() => pick(false)} />
          </View>
          {Platform.OS !== "web" && (
            <View style={{ flex: 1 }}>
              <Button title="Camera" icon="camera" variant="ghost" onPress={() => pick(true)} />
            </View>
          )}
        </View>
        <Button title="Analyze image" icon="scan" onPress={analyze} disabled={!image} />
      </View>

      <Text style={styles.disclaimer}>
        Results are evidence-based estimates, not proof. A skilled forger can evade
        detection; an innocent photo can look unusual.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 6, marginBottom: space.xl },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: space.l },
  logoMark: {
    width: 30,
    height: 30,
    borderRadius: radius.s,
    backgroundColor: palette.accentDim,
    borderWidth: 1,
    borderColor: palette.strokeBright,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { ...t.label, color: palette.text, fontSize: 13, letterSpacing: 3 },
  drop: {
    height: 300,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: palette.strokeBright,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  dropFilled: { borderStyle: "solid", borderColor: palette.stroke },
  dropInner: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: space.l },
  dropIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: palette.accentDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  preview: { width: "100%", height: "100%" },
  clear: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: "rgba(7,11,20,0.75)",
    borderWidth: 1,
    borderColor: palette.strokeBright,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { gap: space.m, marginTop: space.l },
  row: { flexDirection: "row", gap: space.m },
  disclaimer: { ...t.small, textAlign: "center", marginTop: space.xl, paddingHorizontal: space.l },
});
