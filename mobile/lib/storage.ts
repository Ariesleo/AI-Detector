// Persistence: onboarding flag, settings, local history. AsyncStorage works on
// iOS/Android and maps to localStorage on web.
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AnalysisReport, Verdict } from "./types";

const K = {
  onboarded: "veritas.onboarded",
  settings: "veritas.settings",
  history: "veritas.history",
  report: (id: string) => `veritas.report.${id}`,
} as const;

// ---- Settings ----

export interface Settings {
  apiUrl: string | null;       // null → env default
  defaultDetailed: boolean;
}

const DEFAULT_SETTINGS: Settings = { apiUrl: null, defaultDetailed: false };

let _settings: Settings = { ...DEFAULT_SETTINGS };

export function getSettings(): Settings {
  return _settings;
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(K.settings);
    if (raw) _settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* defaults */
  }
  return _settings;
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  _settings = { ..._settings, ...patch };
  await AsyncStorage.setItem(K.settings, JSON.stringify(_settings));
  return _settings;
}

// ---- Onboarding ----

export async function hasOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(K.onboarded)) === "1";
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(K.onboarded, "1");
}

// ---- History ----

export interface HistoryEntry {
  id: string;
  verdict: Verdict;
  confidence: number;
  date: string;        // ISO
  imageUri: string;    // may be stale on web reloads — UI must tolerate
  summary: string;
  engine: string;
}

const HISTORY_LIMIT = 50;

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(K.history);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export async function addToHistory(report: AnalysisReport, imageUri: string): Promise<void> {
  const entry: HistoryEntry = {
    id: report.report_id,
    verdict: report.verdict,
    confidence: report.confidence,
    date: new Date().toISOString(),
    imageUri,
    summary: report.summary,
    engine: report.engine,
  };
  const history = [entry, ...(await getHistory())].slice(0, HISTORY_LIMIT);
  await AsyncStorage.setItem(K.history, JSON.stringify(history));
  await AsyncStorage.setItem(K.report(report.report_id), JSON.stringify(report));
}

export async function getStoredReport(id: string): Promise<AnalysisReport | null> {
  try {
    const raw = await AsyncStorage.getItem(K.report(id));
    return raw ? (JSON.parse(raw) as AnalysisReport) : null;
  } catch {
    return null;
  }
}

export async function clearHistory(): Promise<void> {
  const history = await getHistory();
  await AsyncStorage.multiRemove([K.history, ...history.map((h) => K.report(h.id))]);
}
