// First-launch onboarding: sets the honesty contract.
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef, useState, type ComponentProps } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui";
import { setOnboarded } from "@/lib/storage";
import { palette, radius, space, type as t } from "@/lib/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

const CARDS: { icon: IconName; accent: string; title: string; body: string }[] = [
  {
    icon: "scan",
    accent: palette.accent,
    title: "Evidence, not verdicts",
    body: "Veritas examines images for signs of AI generation or manipulation. It never just says “fake” — it shows you the evidence and how strong it is.",
  },
  {
    icon: "layers",
    accent: "#a78bfa",
    title: "Five forensic layers",
    body: "Cryptographic provenance, metadata fingerprints, statistical forensics, AI visual inspection — and a reasoning engine that weighs it all into one calibrated answer.",
  },
  {
    icon: "shield-half",
    accent: "#4ade80",
    title: "Honest about limits",
    body: "No tool can prove every image real or fake. Sometimes the honest answer is “can’t tell” — and when we say it, we tell you what you can still check yourself.",
  },
];

const { width: SCREEN_W } = Dimensions.get("window");
const PAGE_W = Math.min(SCREEN_W, 680);

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const last = page === CARDS.length - 1;

  async function finish() {
    await setOnboarded();
    router.replace("/(tabs)");
  }

  function next() {
    if (last) return void finish();
    scroller.current?.scrollTo({ x: (page + 1) * PAGE_W, animated: true });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + space.l }]}>
      <Pressable onPress={finish} style={styles.skip} hitSlop={12}>
        <Text style={[t.small, { color: palette.textDim }]}>Skip</Text>
      </Pressable>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setPage(Math.round(e.nativeEvent.contentOffset.x / PAGE_W))
        }
        style={{ flexGrow: 0 }}
      >
        {CARDS.map((c) => (
          <View key={c.title} style={[styles.page, { width: PAGE_W }]}>
            <LinearGradient
              colors={[c.accent + "33", c.accent + "08"]}
              style={[styles.iconHalo, { borderColor: c.accent + "66" }]}
            >
              <Ionicons name={c.icon} size={44} color={c.accent} />
            </LinearGradient>
            <Text style={[t.hero, styles.center]}>{c.title}</Text>
            <Text style={[t.body, styles.center, { fontSize: 15.5 }]}>{c.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {CARDS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === page && { backgroundColor: palette.accent, width: 22 },
              ]}
            />
          ))}
        </View>
        <Button title={last ? "Start verifying" : "Next"} onPress={next} icon={last ? "scan" : "arrow-forward"} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg, justifyContent: "space-between" },
  skip: { alignSelf: "flex-end", padding: space.l },
  page: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
    gap: space.l,
  },
  iconHalo: {
    width: 110,
    height: 110,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.s,
  },
  center: { textAlign: "center" },
  footer: { paddingHorizontal: space.xl, gap: space.l, maxWidth: 680, width: "100%", alignSelf: "center" },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center" },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.stroke,
  },
});
