import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const PHRASES = [
  "Reading pixel frequency patterns...",
  "Analysing compression artifacts...",
  "Checking generator signatures...",
  "Cross-referencing known AI models...",
  "Calculating authenticity score...",
];

interface ScanTheaterProps {
  scanning: boolean;
  durationMs: number;
  children: ReactNode;
}

/**
 * Wraps the uploaded content while scanning: a teal beam sweeps top to
 * bottom, a progress ring fills around the zone, monospace phrases cycle,
 * and a subtle particle burst breathes at the edges.
 */
export function ScanTheater({ scanning, durationMs, children }: ScanTheaterProps) {
  const [phrase, setPhrase] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!scanning) return;
    setPhrase(0);
    const id = setInterval(() => setPhrase((p) => (p + 1) % PHRASES.length), 1100);
    return () => clearInterval(id);
  }, [scanning]);

  return (
    <div>
      <motion.div
        className="relative mx-auto max-w-xl overflow-hidden rounded-[2rem]"
        animate={scanning && !reduce ? { scale: 1.02 } : { scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {children}

        {scanning && (
          <>
            {/* sweeping beam — slow first pass, quicker after */}
            {!reduce && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 h-20"
                style={{
                  background:
                    "linear-gradient(180deg, transparent, rgba(45,212,191,0.35) 50%, transparent)",
                  filter: "blur(2px)",
                }}
                initial={{ top: "-15%" }}
                animate={{ top: ["-15%", "100%"] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.2 }}
              />
            )}

            {/* progress ring around the zone */}
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full"
              style={{ overflow: "visible" }}
            >
              <motion.rect
                x="1.5"
                y="1.5"
                width="calc(100% - 3px)"
                height="calc(100% - 3px)"
                rx="30"
                fill="none"
                stroke="rgba(94,234,212,0.85)"
                strokeWidth="2.5"
                pathLength={100}
                strokeDasharray="100"
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: durationMs / 1000, ease: "linear" }}
                style={{ filter: "drop-shadow(0 0 6px rgba(45,212,191,0.7))" }}
              />
            </svg>

            {/* edge particle burst */}
            {!reduce &&
              [0, 1, 2, 3, 4, 5].map((i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute h-1 w-1 rounded-full bg-teal-200"
                  style={{
                    left: `${12 + i * 15}%`,
                    top: i % 2 === 0 ? "-2px" : "auto",
                    bottom: i % 2 === 1 ? "-2px" : "auto",
                  }}
                  animate={{ opacity: [0, 0.9, 0], y: i % 2 === 0 ? [-2, -14] : [2, 14] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.35 }}
                />
              ))}
          </>
        )}
      </motion.div>

      {/* cycling status text */}
      <div className="mt-6 h-6 text-center" aria-live="polite">
        <AnimatePresence mode="wait">
          {scanning && (
            <motion.p
              key={phrase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="font-mono text-sm text-teal-200/80"
            >
              {PHRASES[phrase]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
