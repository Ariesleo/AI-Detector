import { Fragment, useEffect, useState } from "react";
import { fetchHealth, type Health } from "../../lib/api";

/**
 * Honest engine indicator, driven by the backend's /healthz.
 * Shows the real verdict chain — Claude → Gemini → rules — with the
 * configured engines lit. Replaces the old placeholder provider toggles.
 */
export function EngineStatus() {
  const [health, setHealth] = useState<Health | "offline" | null>(null);

  useEffect(() => {
    let alive = true;
    fetchHealth()
      .then((h) => alive && setHealth(h))
      .catch(() => alive && setHealth("offline"));
    return () => {
      alive = false;
    };
  }, []);

  if (health === "offline") {
    return (
      <p className="mt-8 text-center font-mono text-xs text-uncertain/80">
        analysis server unreachable — start the backend to scan
      </p>
    );
  }

  const engines = [
    { label: "Claude", on: health !== null && health.claude_enabled },
    { label: "Gemini", on: health !== null && health.gemini_enabled },
    { label: "Rules", on: true, note: "always on" },
  ];

  return (
    <div className="mt-8 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-faint">
        detection engines
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {engines.map((e, i) => (
          <Fragment key={e.label}>
            {i > 0 && <span className="text-faint">→</span>}
            <span
              title={e.on ? "active" : "not configured"}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                e.on
                  ? "border-teal-300/50 text-teal-200 shadow-[0_0_16px_rgba(45,212,191,0.2)]"
                  : "border-white/10 text-faint"
              }`}
            >
              <span
                className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${
                  e.on ? "bg-real shadow-[0_0_6px_rgba(0,255,136,0.8)]" : "bg-white/20"
                }`}
              />
              {e.label}
              {e.note && <span className="ml-1.5 opacity-50">· {e.note}</span>}
            </span>
          </Fragment>
        ))}
      </div>
      <p className="mt-3 text-xs text-faint">
        Every scan runs the free forensic layers; the first available engine
        writes the verdict, falling back gracefully.
      </p>
    </div>
  );
}
