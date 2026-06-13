import type { Verdict } from "./types";

/** The three emotional moments of the verdict reveal. */
export type VerdictKind = "real" | "ai" | "uncertain";

export const VERDICT_KIND: Record<Verdict, VerdictKind> = {
  verified_authentic: "real",
  likely_authentic: "real",
  inconclusive: "uncertain",
  likely_ai: "ai",
  confirmed_ai: "ai",
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  verified_authentic: "Verified authentic",
  likely_authentic: "Likely authentic",
  inconclusive: "Inconclusive",
  likely_ai: "AI-generated content detected",
  confirmed_ai: "Confirmed AI-generated",
};

export interface KindMeta {
  color: string;
  caution: string | null;
}

export const KIND_META: Record<VerdictKind, KindMeta> = {
  real: {
    color: "#00FF88",
    caution: null,
  },
  ai: {
    color: "#FF2D55",
    caution: "This content shows signs of AI generation. Treat with caution.",
  },
  uncertain: {
    color: "#FFB300",
    caution: "Our systems found mixed signals. We recommend a second opinion.",
  },
};

export const ENGINE_LABEL: Record<"claude" | "gemini" | "rules", string> = {
  claude: "Claude",
  gemini: "Gemini",
  rules: "deterministic rules",
};

export const DIRECTION_META = {
  ai: { color: "#FF2D55", arrow: "▲", label: "AI" },
  authentic: { color: "#00FF88", arrow: "▼", label: "Authentic" },
  neutral: { color: "#9AA4B8", arrow: "•", label: "Neutral" },
} as const;
