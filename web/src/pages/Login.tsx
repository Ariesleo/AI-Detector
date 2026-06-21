import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GlowButton } from "../components/GlowButton";
import { authEnabled, supabase } from "../lib/supabase";

type Mode = "signin" | "signup";

export function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/detect";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!authEnabled) {
    return (
      <div className="mx-auto max-w-md px-5 pt-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-ink">Accounts</h1>
        <p className="mt-4 text-mist">
          Sign-in isn&apos;t configured on this deployment yet — anonymous
          scanning works without an account.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.session) navigate(next);
        else setNotice("Check your email to confirm your account, then sign in.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        navigate(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-3xl p-6 sm:p-8"
      >
        <h1 className="text-center font-display text-2xl font-semibold tracking-wide text-ink">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-center text-sm text-mist">
          {mode === "signin"
            ? "Sign in to keep a history of everything you verify."
            : "Free forever. Your scan history, saved."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-ink placeholder:text-faint focus:border-teal-300/50 focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-ink placeholder:text-faint focus:border-teal-300/50 focus:outline-none"
          />
          {error && <p className="text-sm text-fake/90">{error}</p>}
          {notice && <p className="text-sm text-teal-200/90">{notice}</p>}
          <GlowButton type="submit" disabled={busy} className="w-full">
            {busy ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
          </GlowButton>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
          className="mt-5 w-full text-center text-sm text-faint hover:text-mist"
        >
          {mode === "signin"
            ? "No account? Create one free"
            : "Already have an account? Sign in"}
        </button>
      </motion.div>
      <p className="mt-6 text-center text-xs text-faint">
        Create a free account to start verifying content. It takes a few seconds.
      </p>
    </div>
  );
}
