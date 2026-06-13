// Mirrors backend/app/models.py — keep in sync.

export type Direction = "ai" | "authentic" | "neutral";
export type Weight = "low" | "medium" | "high" | "conclusive";

export type Verdict =
  | "verified_authentic"
  | "likely_authentic"
  | "inconclusive"
  | "likely_ai"
  | "confirmed_ai";

export interface EvidenceItem {
  layer: string;
  signal: string;
  direction: Direction;
  weight: Weight;
  explanation: string;
}

export interface LayerResult {
  name: string;
  status: "ok" | "skipped" | "error";
  evidence: EvidenceItem[];
  raw: Record<string, unknown>;
  note: string | null;
}

export interface AnalysisReport {
  report_id: string;
  sha256: string;
  verdict: Verdict;
  confidence: number;
  summary: string;
  evidence: EvidenceItem[];
  layers: Record<string, LayerResult>;
  engine: "claude" | "gemini" | "rules";
  cached: boolean;
}

export const VERDICT_META: Record<
  Verdict,
  { label: string; color: string; bg: string; blurb: string }
> = {
  verified_authentic: {
    label: "Verified Authentic",
    color: "#15803d",
    bg: "#dcfce7",
    blurb: "Cryptographically signed capture history.",
  },
  likely_authentic: {
    label: "Likely Authentic",
    color: "#16a34a",
    bg: "#f0fdf4",
    blurb: "Signals are consistent with a real photo.",
  },
  inconclusive: {
    label: "Inconclusive",
    color: "#64748b",
    bg: "#f1f5f9",
    blurb: "Not enough evidence either way — treat with normal skepticism.",
  },
  likely_ai: {
    label: "Likely AI-Generated",
    color: "#ea580c",
    bg: "#fff7ed",
    blurb: "Multiple signals point toward AI generation or manipulation.",
  },
  confirmed_ai: {
    label: "Confirmed AI-Generated",
    color: "#dc2626",
    bg: "#fef2f2",
    blurb: "Signed provenance declares this image AI-generated.",
  },
};
