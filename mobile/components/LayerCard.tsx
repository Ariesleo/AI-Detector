import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/ui";
import { LAYER_META, palette, radius, space, type as t } from "@/lib/theme";
import type { LayerResult } from "@/lib/types";

const STATUS = {
  ok: { color: palette.ok, label: "ran" },
  skipped: { color: palette.textFaint, label: "skipped" },
  error: { color: palette.danger, label: "error" },
} as const;

export function LayerCard({ layer }: { layer: LayerResult }) {
  const meta = LAYER_META[layer.name] ?? {
    title: layer.name,
    desc: "",
    icon: "pulse" as const,
  };
  const s = STATUS[layer.status];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={meta.icon} size={16} color={palette.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{meta.title}</Text>
          <Text style={t.small}>{meta.desc}</Text>
        </View>
        <Chip label={s.label} color={s.color} />
      </View>

      {layer.note ? (
        <Text style={[t.small, { fontStyle: "italic", marginTop: space.s }]}>{layer.note}</Text>
      ) : null}

      {Object.keys(layer.raw).length > 0 && (
        <View style={styles.rawBox}>
          <Text style={t.mono}>{JSON.stringify(layer.raw, null, 1)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.bgRaised,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: space.m,
  },
  header: { flexDirection: "row", alignItems: "center", gap: space.m },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.s,
    backgroundColor: palette.accentDim,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontWeight: "700", fontSize: 14.5, color: palette.text },
  rawBox: {
    marginTop: space.s,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: space.s,
  },
});
