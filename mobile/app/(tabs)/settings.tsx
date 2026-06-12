// Settings: server address, default report mode, history management, about.
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Platform, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { Button, Card, Screen, ScreenHeader, SectionLabel } from "@/components/ui";
import { getApiUrl } from "@/lib/api";
import { clearHistory, getSettings, saveSettings } from "@/lib/storage";
import { palette, radius, space, type as t } from "@/lib/theme";

export default function Settings() {
  const s = getSettings();
  const [apiUrl, setApiUrl] = useState(s.apiUrl ?? "");
  const [defaultDetailed, setDefaultDetailed] = useState(s.defaultDetailed);
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);

  async function persist() {
    await saveSettings({
      apiUrl: apiUrl.trim() ? apiUrl.trim().replace(/\/+$/, "") : null,
      defaultDetailed,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function onClearHistory() {
    const doClear = async () => {
      await clearHistory();
      setCleared(true);
      setTimeout(() => setCleared(false), 1800);
    };
    if (Platform.OS === "web") {
      await doClear();
    } else {
      Alert.alert("Clear history?", "All locally stored reports will be deleted.", [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => void doClear() },
      ]);
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Settings" subtitle="Local preferences — nothing is sent anywhere" />

      <SectionLabel>Server</SectionLabel>
      <Card>
        <Text style={t.small}>Backend address (blank = default)</Text>
        <TextInput
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder={getApiUrl()}
          placeholderTextColor={palette.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <Text style={[t.small, { marginTop: 6 }]}>
          Testing on a phone? Use your computer's LAN IP, e.g. http://192.168.1.20:8000
        </Text>
      </Card>

      <SectionLabel>Reports</SectionLabel>
      <Card>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={[t.h2, { fontSize: 14.5 }]}>Detailed mode by default</Text>
            <Text style={t.small}>Open reports with layer diagnostics expanded</Text>
          </View>
          <Switch
            value={defaultDetailed}
            onValueChange={setDefaultDetailed}
            trackColor={{ true: palette.accent, false: palette.stroke }}
            thumbColor={palette.text}
          />
        </View>
      </Card>

      <View style={{ marginTop: space.l }}>
        <Button
          title={saved ? "Saved ✓" : "Save settings"}
          icon={saved ? undefined : "save"}
          onPress={persist}
        />
      </View>

      <SectionLabel>Data</SectionLabel>
      <Button
        title={cleared ? "History cleared ✓" : "Clear local history"}
        icon="trash"
        variant="danger"
        onPress={onClearHistory}
      />

      <SectionLabel>About</SectionLabel>
      <Card>
        <View style={styles.aboutRow}>
          <Ionicons name="scan" size={16} color={palette.accent} />
          <Text style={[t.h2, { fontSize: 14.5 }]}>Veritas 0.1</Text>
        </View>
        <Text style={[t.body, { marginTop: 6 }]}>
          Veritas looks for evidence of AI generation across five forensic layers and is
          honest when the evidence isn't there. It can be wrong in both directions —
          treat results as a measurement, not a court ruling. Images are analyzed and
          never stored server-side; history lives only on this device.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    marginTop: space.s,
    borderWidth: 1.5,
    borderColor: palette.strokeBright,
    borderRadius: radius.m,
    paddingHorizontal: space.m,
    paddingVertical: 12,
    color: palette.text,
    fontSize: 14.5,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  switchRow: { flexDirection: "row", alignItems: "center", gap: space.m },
  aboutRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
