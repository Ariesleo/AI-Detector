// History: locally persisted past checks.
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Chip, EmptyState, Screen, ScreenHeader } from "@/components/ui";
import { getHistory, type HistoryEntry } from "@/lib/storage";
import { palette, radius, space, type as t, VERDICTS } from "@/lib/theme";

export default function History() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setEntries);
    }, [])
  );

  return (
    <Screen>
      <ScreenHeader
        title="History"
        subtitle={`${entries.length} check${entries.length === 1 ? "" : "s"} · stored on this device only`}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon="time"
          title="No checks yet"
          body="Images you analyze will appear here. History never leaves this device."
        />
      ) : (
        <View style={{ gap: space.s }}>
          {entries.map((e) => (
            <HistoryRow key={e.id} entry={e} onPress={() =>
              router.push({ pathname: "/report/[id]", params: { id: e.id } })
            } />
          ))}
        </View>
      )}
    </Screen>
  );
}

function HistoryRow({ entry, onPress }: { entry: HistoryEntry; onPress: () => void }) {
  const v = VERDICTS[entry.verdict];
  const [imgFailed, setImgFailed] = useState(false);
  const date = new Date(entry.date);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}>
      <View style={styles.thumbWrap}>
        {!imgFailed ? (
          <Image
            source={{ uri: entry.imageUri }}
            style={styles.thumb}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Ionicons name="image" size={20} color={palette.textFaint} />
        )}
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.topRow}>
          <Chip label={v.short} color={v.color} icon={v.icon} />
          <Text style={t.small}>
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        <Text style={t.small} numberOfLines={2}>
          {entry.summary}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={palette.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.m,
    backgroundColor: palette.bgRaised,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: space.m,
  },
  thumbWrap: {
    width: 54,
    height: 54,
    borderRadius: radius.s,
    backgroundColor: palette.bgGlass,
    borderWidth: 1,
    borderColor: palette.stroke,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: { width: "100%", height: "100%" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
});
