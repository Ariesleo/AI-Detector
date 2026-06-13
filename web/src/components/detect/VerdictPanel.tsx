import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { AnalysisReport } from "../../lib/types";
import {
  DIRECTION_META,
  ENGINE_LABEL,
  KIND_META,
  VERDICT_KIND,
  VERDICT_LABEL,
} from "../../lib/verdict";
import { AlertIcon, CheckIcon } from "../icons";

function useTypewriter(text: string, speed = 16) {
  const reduce = useReducedMotion();
  const [out, setOut] = useState(reduce ? text : "");
  useEffect(() => {
    if (reduce) {
      setOut(text);
      return;
    }
    setOut("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, reduce]);
  return out;
}

/** The moment of truth: verdict badge, confidence bar, evidence, explanation. */
export function VerdictPanel({ report }: { report: AnalysisReport }) {
  const kind = VERDICT_KIND[report.verdict];
  const meta = KIND_META[kind];
  const pct = Math.round(report.confidence * 100);
  const typed = useTypewriter(report.summary);
  const [showRaw, setShowRaw] = useState(false);
  const visionRaw = report.layers.vision?.raw as { provider?: unknown } | undefined;
  const visionProvider =
    typeof visionRaw?.provider === "string" ? visionRaw.provider : null;

  return (
    <div className="mx-auto mt-10 max-w-xl">
      {/* verdict orb pulse */}
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className={`flex h-16 w-16 items-center justify-center rounded-full ${
            kind === "uncertain" ? "flicker-slow" : ""
          }`}
          style={{
            background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25), ${meta.color}33 45%, transparent 75%)`,
            border: `1px solid ${meta.color}88`,
            boxShadow: `0 0 38px ${meta.color}55`,
            color: meta.color,
          }}
        >
          {kind === "real" ? <CheckIcon size={28} /> : <AlertIcon size={26} />}
        </motion.div>
      </div>

      {/* outward pulse wave */}
      <motion.div
        aria-hidden
        className="pointer-events-none relative mx-auto -mt-16 h-16 w-16 rounded-full"
        style={{ border: `1.5px solid ${meta.color}` }}
        initial={{ scale: 1, opacity: 0.7 }}
        animate={{ scale: 4.5, opacity: 0 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />

      {/* badge slides into place */}
      <motion.div
        initial={{ y: -22, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.15 }}
        className="mt-8 text-center"
      >
        <span
          className="inline-block rounded-full border px-5 py-2 font-display text-lg font-semibold tracking-wide"
          style={{ color: meta.color, borderColor: `${meta.color}66`, background: `${meta.color}11` }}
        >
          {VERDICT_LABEL[report.verdict]} — {pct}% confidence
        </span>
        {report.cached && (
          <p className="mt-2 font-mono text-[11px] text-faint">previously analyzed · served from cache</p>
        )}
      </motion.div>

      {/* confidence bar with spring physics */}
      <div className="mt-6">
        <div className="flex justify-between font-mono text-[11px] text-faint">
          <span>confidence</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: meta.color, boxShadow: `0 0 12px ${meta.color}99` }}
            initial={{ width: "0%" }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.35 }}
          />
        </div>
      </div>

      {meta.caution && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-center text-sm text-uncertain/90"
        >
          {meta.caution}
        </motion.p>
      )}

      {/* explanation panel — typed in real time */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="glass mt-10 rounded-3xl p-7"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal-200/70">
          What this means for you
          <span className="ml-2 normal-case tracking-normal text-faint">
            · verdict by {ENGINE_LABEL[report.engine]}
          </span>
        </p>
        <p className="mt-3 min-h-16 leading-relaxed text-ink/90">
          {typed}
          <span className="animate-pulse text-teal-300">▍</span>
        </p>

        {report.evidence.length > 0 && (
          <div className="mt-6 space-y-3 border-t border-white/5 pt-5">
            {report.evidence.map((e, i) => {
              const d = DIRECTION_META[e.direction];
              return (
                <motion.div
                  key={`${e.signal}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.12 }}
                  className="flex gap-3"
                >
                  <span className="mt-0.5 w-4 text-center" style={{ color: d.color }}>
                    {d.arrow}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {e.signal.replaceAll("_", " ")}
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-faint">
                        {e.layer} · {e.weight}
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-mist">{e.explanation}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        <p className="mt-5 font-mono text-[10px] text-faint">
          engine: {report.engine}
          {visionProvider ? ` · vision: ${visionProvider}` : ""} · sha256:{" "}
          {report.sha256.slice(0, 16)}…
        </p>
      </motion.div>

      {/* raw output for developers */}
      <div className="mt-6">
        <button
          onClick={() => setShowRaw((s) => !s)}
          className="font-mono text-xs text-faint transition-colors hover:text-mist"
        >
          {showRaw ? "▾" : "▸"} View raw API response
        </button>
        {showRaw && (
          <pre className="glass mt-3 max-h-80 overflow-auto rounded-2xl p-5 font-mono text-[11px] leading-relaxed text-mist">
            {JSON.stringify(report, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
