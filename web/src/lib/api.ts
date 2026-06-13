import type { AnalysisReport } from "./types";

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://127.0.0.1:8000";

export interface Health {
  ok: boolean;
  claude_enabled: boolean;
  gemini_enabled: boolean;
  supabase_enabled: boolean;
  upstash_enabled: boolean;
}

export async function fetchHealth(): Promise<Health> {
  const res = await fetch(`${API_URL}/healthz`);
  if (!res.ok) throw new Error(`healthz ${res.status}`);
  return (await res.json()) as Health;
}

export async function analyzeFile(file: File): Promise<AnalysisReport> {
  const form = new FormData();
  form.append("file", file, file.name);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1/analyze`, { method: "POST", body: form });
  } catch {
    throw new Error(
      "Could not reach the analysis server. Make sure the backend is running, then try again.",
    );
  }
  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { detail?: string };
      detail = body.detail ?? "";
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 429) throw new Error(detail || "Daily scan limit reached.");
    if (res.status === 415) throw new Error(detail || "This file type is not supported yet.");
    throw new Error(detail || `Analysis failed (${res.status}).`);
  }
  return (await res.json()) as AnalysisReport;
}
