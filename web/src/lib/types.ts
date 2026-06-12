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
  engine: "claude" | "rules";
  cached: boolean;
}
