import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GlowLink } from "../components/GlowButton";
import { Reveal } from "../components/Reveal";
import { fetchHistory, type HistoryEntry } from "../lib/api";
import { useSession } from "../lib/useSession";
import { authEnabled } from "../lib/supabase";
import { ImageIcon } from "../components/icons";
import { KIND_META, VERDICT_KIND, VERDICT_LABEL } from "../lib/verdict";

export function History() {
  const { session, loading } = useSession();
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchHistory()
      .then(setEntries)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [session]);

  if (!authEnabled || (!loading && !session)) {
    return (
      <div className="mx-auto max-w-md px-5 pt-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-ink">History</h1>
        <p className="mt-4 text-mist">
          Sign in to keep a record of everything you verify — every scan,
          verdict, and confidence score, saved to your workspace.
        </p>
        {authEnabled && (
          <GlowLink to="/login" className="mt-8">
            Sign in
          </GlowLink>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-10">
      <Reveal>
        <h1 className="font-display text-3xl font-semibold tracking-wide text-ink">
          Your scan history
        </h1>
        <p className="mt-2 text-sm text-mist">
          Everything verified in this workspace, newest first.
        </p>
      </Reveal>

      {error && <p className="mt-8 text-sm text-fake/90">{error}</p>}

      {entries !== null && entries.length === 0 && (
        <Reveal delay={0.1}>
          <div className="glass mt-10 rounded-3xl p-10 text-center">
            <p className="text-mist">No scans yet.</p>
            <GlowLink to="/detect" variant="ghost" className="mt-6">
              Scan your first image
            </GlowLink>
          </div>
        </Reveal>
      )}

      <div className="mt-8 space-y-3">
        {(entries ?? []).map((e, i) => {
          const kind = VERDICT_KIND[e.verdict];
          const meta = KIND_META[kind];
          return (
            <Reveal key={`${e.report_id}-${i}`} delay={Math.min(i * 0.06, 0.4)}>
              <div className="glass flex items-center gap-4 rounded-2xl px-4 py-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-white/[0.03]"
                  style={{ boxShadow: `inset 0 0 20px ${meta.color}14` }}
                >
                  {e.thumb_url ? (
                    <img
                      src={e.thumb_url}
                      alt="Scanned content"
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={20} className="text-faint" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-block rounded-full border px-3 py-1 text-xs font-medium"
                    style={{
                      color: meta.color,
                      borderColor: `${meta.color}55`,
                      background: `${meta.color}11`,
                    }}
                  >
                    {VERDICT_LABEL[e.verdict]} · {Math.round(e.confidence * 100)}%
                  </span>
                  <p className="mt-2 truncate font-mono text-[11px] text-faint">
                    {e.sha256.slice(0, 20)}… · {new Date(e.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {entries !== null && entries.length > 0 && (
        <p className="mt-10 text-center">
          <Link to="/detect" className="text-sm text-teal-200/90 underline-offset-4 hover:underline">
            Scan something else →
          </Link>
        </p>
      )}
    </div>
  );
}
