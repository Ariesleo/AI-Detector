import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { GlowButton } from "../components/GlowButton";
import { DocIcon, VideoIcon, WaveIcon } from "../components/icons";
import { EngineStatus } from "../components/detect/EngineStatus";
import { ScanTheater } from "../components/detect/ScanTheater";
import { UploadZone } from "../components/detect/UploadZone";
import { VerdictPanel } from "../components/detect/VerdictPanel";
import { analyzeFile } from "../lib/api";
import type { AnalysisReport } from "../lib/types";
import { VERDICT_KIND } from "../lib/verdict";

type Stage = "idle" | "ready" | "scanning" | "done" | "error";

const THEATER_MS = 5600; // minimum drama, even when the API answers instantly

function fileKindIcon(type: string) {
  if (type.startsWith("audio/")) return WaveIcon;
  if (type.startsWith("video/")) return VideoIcon;
  return DocIcon;
}

export function Detect() {
  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isImage = file?.type.startsWith("image/") ?? false;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onFile = useCallback((f: File) => {
    setFile(f);
    setReport(null);
    setError(null);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return f.type.startsWith("image/") ? URL.createObjectURL(f) : null;
    });
    setStage("ready");
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setReport(null);
    setError(null);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setStage("idle");
  }, []);

  async function analyse() {
    if (!file) return;
    setStage("scanning");
    setError(null);
    const theater = new Promise((r) => setTimeout(r, THEATER_MS));
    try {
      const [rep] = await Promise.all([analyzeFile(file), theater]);
      setReport(rep);
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage("error");
    }
  }

  const kind = report ? VERDICT_KIND[report.verdict] : null;
  const FileIcon = file ? fileKindIcon(file.type) : DocIcon;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-10">
      <div className="pt-8 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-wide text-ink sm:text-4xl">
          Scan anything.
        </h1>
        <p className="mt-3 text-mist">
          Drop a file below. Veritas reads the evidence and tells you what it found.
        </p>
      </div>

      <div className="mt-10">
        <AnimatePresence mode="wait">
          {stage === "idle" ? (
            <UploadZone key="zone" onFile={onFile} />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ScanTheater scanning={stage === "scanning"} durationMs={THEATER_MS}>
                <div className="glass relative flex min-h-56 items-center justify-center overflow-hidden rounded-[2rem] p-4">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Uploaded content being analyzed"
                      className="max-h-[26rem] w-auto rounded-2xl object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center py-10 text-center">
                      <FileIcon size={44} className="text-teal-200/70" />
                      <p className="mt-4 max-w-xs break-all font-mono text-sm text-mist">
                        {file?.name}
                      </p>
                    </div>
                  )}
                  {/* one-frame glitch on an AI verdict */}
                  {stage === "done" && kind === "ai" && (
                    <div aria-hidden className="glitch-once pointer-events-none absolute inset-0" />
                  )}
                </div>
              </ScanTheater>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* live engine status from the backend */}
      {(stage === "ready" || stage === "idle") && <EngineStatus />}

      {/* analyse / state actions */}
      {stage === "ready" && (
        <div className="mt-8 text-center">
          {!isImage && (
            <p className="mx-auto mb-4 max-w-md text-sm text-uncertain/90">
              Audio, video, and document detection are rolling out — today&apos;s
              pipeline analyzes images. Drop a JPG, PNG, WEBP, TIFF, or HEIC to scan.
            </p>
          )}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <GlowButton onClick={analyse} disabled={!isImage}>
              Analyse
            </GlowButton>
            <button
              onClick={reset}
              className="min-h-11 px-3 py-2 text-sm text-faint hover:text-mist active:text-mist"
            >
              choose a different file
            </button>
          </div>
        </div>
      )}

      {stage === "error" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mx-auto mt-8 max-w-md rounded-3xl p-6 text-center"
        >
          <p className="text-sm leading-relaxed text-fake/90">{error}</p>
          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <GlowButton variant="ghost" onClick={analyse}>
              Try again
            </GlowButton>
            <button
              onClick={reset}
              className="min-h-11 px-3 py-2 text-sm text-faint hover:text-mist active:text-mist"
            >
              start over
            </button>
          </div>
        </motion.div>
      )}

      {stage === "done" && report && (
        <>
          <VerdictPanel report={report} />
          <div className="mt-10 text-center">
            <GlowButton variant="ghost" onClick={reset}>
              Scan something else
            </GlowButton>
          </div>
        </>
      )}

      {/* pro upsell — quiet and warm */}
      <div className="glass mt-20 rounded-3xl p-7 text-center">
        <p className="text-sm leading-relaxed text-mist">
          Multi-engine scans with side-by-side comparison are coming to{" "}
          <span className="text-teal-200">Pro</span>
        </p>
        <a
          href="/pricing"
          className="mt-4 inline-block rounded-full border border-teal-300/30 px-5 py-2 text-sm text-teal-200 shadow-[0_0_18px_rgba(45,212,191,0.15)] transition-shadow hover:shadow-[0_0_28px_rgba(45,212,191,0.35)]"
        >
          See Pro
        </a>
      </div>
    </div>
  );
}
