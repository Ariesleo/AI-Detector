import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { DIRECTIONS, palette, radius, space, type as t, WEIGHT_DOTS } from "@/lib/theme";
import type { EvidenceItem } from "@/lib/types";

export function EvidenceRow({ item }: { item: EvidenceItem }) {
  const d = DIRECTIONS[item.direction];
  const dots = WEIGHT_DOTS[item.weight];

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: d.color + "1f", borderColor: d.color + "55" }]}>
        <Ionicons name={d.icon} size={15} color={d.color} />
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <View style={styles.header}>
          <Text style={styles.signal}>{item.signal.replace(/_/g, " ")}</Text>
          <View style={styles.dots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i < dots ? d.color : palette.stroke },
                ]}
              />
            ))}
          </View>
        </View>
        <Text style={t.body}>{item.explanation}</Text>
        <Text style={[t.small, { color: palette.textFaint }]}>
          {item.layer} · {item.weight} weight · {d.label.toLowerCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: space.m,
    backgroundColor: palette.bgRaised,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: space.m,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  signal: {
    flex: 1,
    fontWeight: "700",
    fontSize: 14.5,
    color: palette.text,
    textTransform: "capitalize",
  },
  dots: { flexDirection: "row", gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
