// Veritas design system — dark "forensic instrument" aesthetic.
import type { Direction, Verdict, Weight } from "./types";

export const palette = {
  bg: "#070b14",          // near-black blue
  bgRaised: "#0d1424",    // card base
  bgGlass: "rgba(148,163,184,0.06)",
  stroke: "rgba(148,163,184,0.14)",
  strokeBright: "rgba(148,163,184,0.28)",

  text: "#e8edf7",
  textDim: "#94a3b8",
  textFaint: "#5b6b82",

  accent: "#22d3ee",      // scanner cyan
  accentDim: "rgba(34,211,238,0.14)",

  danger: "#f87171",
  warn: "#fbbf24",
  ok: "#34d399",
} as const;

export const space = { xs: 4, s: 8, m: 14, l: 20, xl: 28, xxl: 40 } as const;

export const radius = { s: 8, m: 14, l: 20, xl: 28, pill: 999 } as const;

export const type = {
  hero: { fontSize: 32, fontWeight: "800" as const, color: palette.text, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: "800" as const, color: palette.text, letterSpacing: -0.3 },
  h2: { fontSize: 17, fontWeight: "700" as const, color: palette.text },
  body: { fontSize: 14.5, lineHeight: 22, color: palette.textDim },
  small: { fontSize: 12.5, lineHeight: 18, color: palette.textFaint },
  mono: { fontSize: 11.5, fontFamily: "monospace" as const, color: palette.textDim },
  label: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
    color: palette.textFaint,
  },
} as const;

// ---- Verdict semantics (dark-tuned) ----

export interface VerdictTheme {
  label: string;
  short: string;
  color: string;
  soft: string;       // tinted card bg
  gradient: [string, string];
  blurb: string;
  icon: "shield-checkmark" | "checkmark-circle" | "help-circle" | "warning" | "alert-circle";
}

export const VERDICTS: Record<Verdict, VerdictTheme> = {
  verified_authentic: {
    label: "Verified Authentic",
    short: "Verified",
    color: "#34d399",
    soft: "rgba(52,211,153,0.10)",
    gradient: ["rgba(52,211,153,0.22)", "rgba(52,211,153,0.04)"],
    blurb: "Cryptographically signed capture history — the strongest possible evidence.",
    icon: "shield-checkmark",
  },
  likely_authentic: {
    label: "Likely Authentic",
    short: "Likely real",
    color: "#4ade80",
    soft: "rgba(74,222,128,0.10)",
    gradient: ["rgba(74,222,128,0.18)", "rgba(74,222,128,0.03)"],
    blurb: "Signals are consistent with a real photograph. Not a guarantee.",
    icon: "checkmark-circle",
  },
  inconclusive: {
    label: "Inconclusive",
    short: "Can't tell",
    color: "#94a3b8",
    soft: "rgba(148,163,184,0.10)",
    gradient: ["rgba(148,163,184,0.16)", "rgba(148,163,184,0.03)"],
    blurb: "Not enough evidence either way. Treat with normal skepticism — this is an honest answer, not a failure.",
    icon: "help-circle",
  },
  likely_ai: {
    label: "Likely AI-Generated",
    short: "Likely AI",
    color: "#fb923c",
    soft: "rgba(251,146,60,0.10)",
    gradient: ["rgba(251,146,60,0.20)", "rgba(251,146,60,0.04)"],
    blurb: "Multiple signals point toward AI generation or manipulation.",
    icon: "warning",
  },
  confirmed_ai: {
    label: "Confirmed AI-Generated",
    short: "Confirmed AI",
    color: "#f87171",
    soft: "rgba(248,113,113,0.10)",
    gradient: ["rgba(248,113,113,0.22)", "rgba(248,113,113,0.04)"],
    blurb: "Signed provenance declares this image AI-generated. This is certain.",
    icon: "alert-circle",
  },
};

export const DIRECTIONS: Record<Direction, { color: string; label: string; icon: "arrow-up" | "arrow-down" | "remove" }> = {
  ai: { color: "#fb923c", label: "AI signal", icon: "arrow-up" },
  authentic: { color: "#4ade80", label: "Authentic", icon: "arrow-down" },
  neutral: { color: "#94a3b8", label: "Neutral", icon: "remove" },
};

export const WEIGHT_DOTS: Record<Weight, number> = { low: 1, medium: 2, high: 3, conclusive: 4 };

export const LAYER_META: Record<string, { title: string; desc: string; icon: "finger-print" | "document-text" | "pulse" | "eye" }> = {
  provenance: { title: "Provenance", desc: "C2PA Content Credentials", icon: "finger-print" },
  metadata: { title: "Metadata", desc: "EXIF · XMP · generation params", icon: "document-text" },
  forensics: { title: "Forensics", desc: "ELA · noise · frequency", icon: "pulse" },
  vision: { title: "Vision", desc: "Claude visual inspection", icon: "eye" },
};
