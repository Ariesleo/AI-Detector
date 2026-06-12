// Report: verdict panel, evidence, what-we-couldn't-check, verify-further
// links, detailed layer diagnostics.
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { EvidenceRow } from "@/components/EvidenceRow";
import { LayerCard } from "@/components/LayerCard";
import { Button, Card, EmptyState, Screen, ScreenHeader, SectionLabel } from "@/components/ui";
import { VerdictCard } from "@/components/VerdictCard";
import { getSettings, getStoredReport } from "@/lib/storage";
import { getImageUri, getReport } from "@/lib/store";
import { LAYER_META, palette, radius, space, type as t } from "@/lib/theme";
import type { AnalysisReport } from "@/lib/types";

export default function Report() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [detailed, setDetailed] = useState(getSettings().defaultDetailed);
  const [report, setReport] = useState<AnalysisReport | undefined>(
    id ? getReport(id) : undefined
  );

  // Fall back to persisted copy (history navigation after app restart).
  useEffect(() => {
    if (!report && id) {
      getStoredReport(id).then((r) => r && setReport(r));
    }
  }, [id, report]);

  const imageUri = id ? getImageUri(id) : undefined;

  if (!report) {
    return (
      <Screen>
        <ScreenHeader title="Report" onBack={() => router.back()} />
        <EmptyState
          icon="document-text"
          title="Report not found"
          body="It may have been cleared from local history."
        />
        <Button title="Analyze a new image" icon="scan" onPress={() => router.replace("/(tabs)")} />
      </Screen>
    );
  }

  const skipped = Object.values(report.layers).filter((l) => l.status !== "ok");

  return (
    <Screen>
      <ScreenHeader
        title="Analysis Report"
        subtitle={`#${report.report_id} · ${report.engine === "claude" ? "Claude reasoning" : "rule-based"} engine`}
        onBack={() => router.back()}
      />

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.thumb} resizeMode="cover" />
      )}

      <VerdictCard report={report} />

      <View style={styles.modeRow}>
        <View style={{ flex: 1 }}>
          <Text style={[t.h2, { fontSize: 14.5 }]}>Detailed mode</Text>
          <Text style={t.small}>Layer diagnostics & raw values for fact-checkers</Text>
        </View>
        <Switch
          value={detailed}
          onValueChange={setDetailed}
          trackColor={{ true: palette.accent, false: palette.stroke }}
          thumbColor={palette.text}
        />
      </View>

      <SectionLabel>Evidence</SectionLabel>
      <View style={{ gap: space.s }}>
        {report.evidence.length === 0 ? (
          <EmptyState
            icon="search"
            title="No signals found"
            body="Every layer ran without finding evidence in either direction — which is itself why this verdict is inconclusive."
          />
        ) : (
          report.evidence.map((e, i) => <EvidenceRow key={i} item={e} />)
        )}
      </View>

      {skipped.length > 0 && !detailed && (
        <View style={styles.skippedNote}>
          <Ionicons name="information-circle" size={15} color={palette.textFaint} />
          <Text style={[t.small, { flex: 1 }]}>
            Not checked: {skipped.map((l) => LAYER_META[l.name]?.title ?? l.name).join(", ")}.
            Turn on detailed mode to see why.
          </Text>
        </View>
      )}

      <SectionLabel>Verify further yourself</SectionLabel>
      <Card>
        <Text style={t.body}>
          A reverse image search can find earlier or original versions — the strongest
          check for real-but-miscaptioned photos.
        </Text>
        <View style={styles.linkRow}>
          <ExternalLink label="Google Lens" url="https://lens.google.com" />
          <ExternalLink label="TinEye" url="https://tineye.com" />
        </View>
      </Card>

      {detailed && (
        <>
          <SectionLabel>Layer diagnostics</SectionLabel>
          <View style={{ gap: space.s }}>
            {Object.values(report.layers).map((layer) => (
              <LayerCard key={layer.name} layer={layer} />
            ))}
          </View>
          <Text style={[t.mono, { marginTop: space.m }]}>
            sha256 {report.sha256.slice(0, 32)}…{"\n"}
            engine {report.engine} · {report.cached ? "cached result" : "fresh analysis"}
          </Text>
        </>
      )}

      <View style={{ marginTop: space.xl }}>
        <Button title="Analyze another image" icon="scan" onPress={() => router.replace("/(tabs)")} />
      </View>
    </Screen>
  );
}

function ExternalLink({ label, url }: { label: string; url: string }) {
  return (
    <Pressable style={styles.extLink} onPress={() => Linking.openURL(url)}>
      <Text style={{ color: palette.accent, fontWeight: "700", fontSize: 13.5 }}>{label}</Text>
      <Ionicons name="open-outline" size={14} color={palette.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  thumb: {
    height: 200,
    borderRadius: radius.l,
    backgroundColor: palette.bgRaised,
    borderWidth: 1,
    borderColor: palette.stroke,
    marginBottom: space.m,
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.m,
    backgroundColor: palette.bgGlass,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: space.m,
    marginTop: space.m,
  },
  skippedNote: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    marginTop: space.m,
    paddingHorizontal: 4,
  },
  linkRow: { flexDirection: "row", gap: space.m, marginTop: space.m },
  extLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: palette.strokeBright,
    borderRadius: radius.m,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
