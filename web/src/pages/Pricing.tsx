import { GlowLink } from "../components/GlowButton";
import { CheckIcon } from "../components/icons";
import { Reveal } from "../components/Reveal";

const FREE = [
  "10 scans per day",
  "HuggingFace detection",
  "Verdict and confidence score",
  "All content types",
  "No account needed",
];

const PRO = [
  "Unlimited scans",
  "HuggingFace + Hive Moderation simultaneously",
  "Side-by-side provider comparison",
  "Plain English AI explanation for every scan",
  "Full scan history",
  "API access for developers",
  "Priority support",
];

export function Pricing() {
  return (
    <div className="mx-auto max-w-4xl px-5">
      <div className="pt-12 text-center">
        <Reveal>
          <h1 className="font-display text-4xl font-semibold tracking-wide text-ink sm:text-5xl">
            Simple, honest pricing
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-4 text-lg text-mist">
            Truth should not be a luxury. The free tier is real, and it stays.
          </p>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {/* Free */}
        <Reveal>
          <div className="glass flex h-full flex-col rounded-3xl p-8">
            <h2 className="font-display text-xl font-semibold text-ink">Free</h2>
            <p className="mt-1 font-display text-4xl font-semibold text-ink">
              $0
              <span className="text-base font-normal text-faint"> / forever</span>
            </p>
            <ul className="mt-7 flex-1 space-y-3.5">
              {FREE.map((f) => (
                <li key={f} className="flex items-start gap-3 text-mist">
                  <CheckIcon size={17} className="mt-0.5 shrink-0 text-teal-300/80" />
                  {f}
                </li>
              ))}
            </ul>
            <GlowLink to="/detect" variant="ghost" className="mt-8 w-full">
              Start free
            </GlowLink>
          </div>
        </Reveal>

        {/* Pro */}
        <Reveal delay={0.15}>
          <div
            className="glass relative flex h-full flex-col rounded-3xl p-8"
            style={{
              borderColor: "rgba(168, 130, 255, 0.35)",
              boxShadow: "0 0 44px rgba(120, 90, 220, 0.18), inset 0 0 60px rgba(45,212,191,0.04)",
            }}
          >
            <span className="absolute -top-3 right-6 rounded-full border border-purple-300/40 bg-midnight px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-purple-300">
              Pro
            </span>
            <h2 className="font-display text-xl font-semibold text-ink">Pro</h2>
            <p className="mt-1 font-display text-4xl font-semibold text-ink">
              $9
              <span className="text-base font-normal text-faint"> / month</span>
            </p>
            <ul className="mt-7 flex-1 space-y-3.5">
              {PRO.map((f) => (
                <li key={f} className="flex items-start gap-3 text-mist">
                  <CheckIcon size={17} className="mt-0.5 shrink-0 text-purple-300/90" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <button
                disabled
                className="w-full cursor-not-allowed rounded-full border border-purple-300/40 px-6 py-3 font-display text-sm font-semibold text-purple-200 opacity-80"
              >
                Stripe-powered — one click to upgrade
              </button>
              <p className="mt-2 text-center font-mono text-[10px] text-faint">
                launching soon
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.25}>
        <p className="mx-auto mt-12 max-w-xl text-center text-sm leading-relaxed text-faint">
          Pro pricing helps cover the cost of running premium AI detection APIs.
          The free tier is — and will always remain — free. Everyone deserves a
          way to check what&apos;s real.
        </p>
      </Reveal>
    </div>
  );
}
