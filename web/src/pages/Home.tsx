import { Link } from "react-router-dom";
import { CountUp } from "../components/CountUp";
import { GlowLink } from "../components/GlowButton";
import { DocIcon, ImageIcon, VideoIcon, WaveIcon } from "../components/icons";
import { Orb } from "../components/Orb";
import { Reveal } from "../components/Reveal";

/* ---------- ambient card visuals (problem section) ---------- */

function FaceScanVisual() {
  return (
    <div className="relative mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
      {/* abstract face */}
      <svg viewBox="0 0 24 24" width="58" height="58" fill="none" stroke="rgba(190,215,230,0.5)" strokeWidth="1.2" strokeLinecap="round">
        <ellipse cx="12" cy="12" rx="6.4" ry="7.6" />
        <path d="M9.4 10.4h.01M14.6 10.4h.01" strokeWidth="2" />
        <path d="M9.8 15a3.2 3.2 0 0 0 4.4 0" />
      </svg>
      {/* slow horizontal scan line */}
      <div className="scanline-x absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-transparent via-teal-300/35 to-transparent" />
    </div>
  );
}

function WaveBreathVisual() {
  const bars = [0.3, 0.55, 0.8, 1, 0.7, 0.9, 0.5, 0.35];
  return (
    <div className="mx-auto flex h-28 w-28 items-center justify-center gap-1.5 rounded-2xl border border-white/8 bg-white/[0.02]">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-teal-300/50"
          style={{
            height: `${h * 56}px`,
            transformOrigin: "center",
            animation: `breathe-bar ${2.4 + (i % 3) * 0.5}s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function PageTurnVisual() {
  return (
    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.02]" style={{ perspective: "300px" }}>
      <div className="relative h-16 w-12 rounded-sm border border-white/20 bg-white/[0.04]">
        <div className="absolute inset-x-2 top-3 h-px bg-white/25" />
        <div className="absolute inset-x-2 top-6 h-px bg-white/25" />
        <div className="absolute inset-x-2 top-9 h-px bg-white/25" />
        <div
          className="absolute inset-0 rounded-sm border border-white/25 bg-[#101a30]"
          style={{ transformOrigin: "left center", animation: "page-turn 6s ease-in-out infinite" }}
        >
          <div className="absolute inset-x-2 top-3 h-px bg-white/20" />
          <div className="absolute inset-x-2 top-6 h-px bg-white/20" />
        </div>
      </div>
    </div>
  );
}

const PROBLEMS = [
  {
    visual: <FaceScanVisual />,
    title: "You can not trust what you see",
    body: "AI can now generate photorealistic images of people, places, and events that never happened. Misinformation spreads in seconds.",
  },
  {
    visual: <WaveBreathVisual />,
    title: "You can not trust what you hear",
    body: "Voice cloning technology lets scammers sound exactly like your family. Grandparents lose thousands of dollars to calls from voices they recognise.",
  },
  {
    visual: <PageTurnVisual />,
    title: "You can not trust what you read",
    body: "AI can generate forged contracts, fake invoices, and fabricated reports that pass visual inspection. Businesses and individuals are targeted daily.",
  },
];

const THREATS = [
  { icon: ImageIcon, label: "Images", desc: "Photorealistic fakes, manipulated photos, synthetic faces.", hash: "images" },
  { icon: WaveIcon, label: "Audio calls", desc: "Cloned voices and scam calls that sound like family.", hash: "audio" },
  { icon: VideoIcon, label: "Videos", desc: "Deepfakes and frame-level synthetic video.", hash: "videos" },
  { icon: DocIcon, label: "Documents", desc: "Forged contracts, fake invoices, fabricated reports.", hash: "documents" },
];

export function Home() {
  return (
    <div className="px-5">
      {/* ---------- hero ---------- */}
      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center text-center">
        <Reveal>
          <Orb size={300} className="mx-auto" />
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-2 text-sm uppercase tracking-[0.3em] text-mist">
            In a world full of fakes
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <h1 className="mt-5 font-display text-5xl font-semibold tracking-wide text-ink sm:text-7xl">
            Find what is real.
          </h1>
        </Reveal>
        <Reveal delay={0.38}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-mist">
            Veritas detects AI-generated images, cloned voices, deepfake videos,
            and forged documents — so you always know the truth.
          </p>
        </Reveal>
        <Reveal delay={0.5}>
          <GlowLink to="/detect" className="mt-10">
            Try it free — create your account
          </GlowLink>
        </Reveal>
        <Reveal delay={0.62}>
          <p className="mt-5 text-xs text-faint">
            Used by journalists, researchers, and people protecting their families.
          </p>
        </Reveal>
      </section>

      {/* ---------- the problem ---------- */}
      <section className="mx-auto mt-10 max-w-6xl">
        <div className="grid gap-6 md:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.18}>
              <div className="glass h-full rounded-3xl p-8">
                {p.visual}
                <h3 className="mt-7 font-display text-xl font-semibold tracking-wide text-ink">
                  {p.title}
                </h3>
                <p className="mt-3 leading-relaxed text-mist">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- the hope (turning point) ---------- */}
      <section className="relative mx-auto mt-36 max-w-4xl text-center">
        {/* the aurora brightens here */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-40 -inset-y-24 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(45,212,191,0.12), rgba(26,10,46,0.08) 55%, transparent 75%)",
          }}
        />
        <Reveal>
          <h2 className="font-display text-4xl font-semibold tracking-wide text-ink sm:text-5xl">
            But truth still exists.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-mist">
            Every piece of AI-generated content leaves traces. Pixel patterns that
            do not match reality. Voice frequencies that no human throat can
            produce. Metadata that does not add up. Veritas reads all of it — and
            tells you what is real.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          <Reveal delay={0.1}>
            <div className="font-display text-4xl font-semibold text-teal-200 drop-shadow-[0_0_18px_rgba(45,212,191,0.4)]">
              <CountUp value={99.3} decimals={1} suffix="%" />
            </div>
            <p className="mt-2 text-sm text-mist">accuracy on benchmark datasets</p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="font-display text-4xl font-semibold text-teal-200 drop-shadow-[0_0_18px_rgba(45,212,191,0.4)]">
              under <CountUp value={3} suffix="s" />
            </div>
            <p className="mt-2 text-sm text-mist">from upload to verdict</p>
          </Reveal>
          <Reveal delay={0.4}>
            <div className="font-display text-2xl font-medium leading-snug text-teal-200/90 drop-shadow-[0_0_18px_rgba(45,212,191,0.3)]">
              Any image, audio clip, or document
            </div>
            <p className="mt-2 text-sm text-mist">no technical knowledge needed</p>
          </Reveal>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="mx-auto mt-36 max-w-5xl">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-semibold tracking-wide text-ink sm:text-4xl">
            How it works
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Upload anything", d: "An image, a voice recording, a document, a video clip." },
            { n: "02", t: "Veritas scans it", d: "Across multiple AI detection systems simultaneously." },
            { n: "03", t: "You get a clear verdict", d: "Real or fake — with a plain English explanation of why." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 0.16}>
              <div className="glass rounded-3xl p-8">
                <span className="font-mono text-sm text-teal-300/80">{s.n}</span>
                <h3 className="mt-3 font-display text-xl font-semibold text-ink">{s.t}</h3>
                <p className="mt-2 leading-relaxed text-mist">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.3}>
          <p className="mt-8 text-center">
            <Link to="/how-it-works" className="text-sm text-teal-200/90 underline-offset-4 hover:underline">
              See the science behind every verdict →
            </Link>
          </p>
        </Reveal>
      </section>

      {/* ---------- threat types ---------- */}
      <section className="mx-auto mt-36 max-w-6xl">
        <Reveal>
          <h2 className="text-center font-display text-3xl font-semibold tracking-wide text-ink sm:text-4xl">
            What Veritas watches for
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {THREATS.map((t, i) => (
            <Reveal key={t.label} delay={i * 0.12}>
              <Link
                to={`/how-it-works#${t.hash}`}
                className="glass group block h-full rounded-3xl p-7 transition-shadow duration-300 hover:shadow-[0_0_36px_rgba(45,212,191,0.18)]"
              >
                <t.icon size={30} className="text-teal-200/80 transition-transform duration-300 group-hover:scale-110" />
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{t.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{t.desc}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <section className="mx-auto mt-40 max-w-3xl pb-10 text-center">
        <Reveal>
          <div className="relative mx-auto h-56 w-56">
            <Orb size={170} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" mini />
            {/* orbiting content-type icons */}
            <div className="orbit absolute inset-0">
              {[ImageIcon, WaveIcon, VideoIcon, DocIcon].map((I, i) => {
                const angle = (i / 4) * Math.PI * 2;
                const x = 50 + 46 * Math.cos(angle);
                const y = 50 + 46 * Math.sin(angle);
                return (
                  <span
                    key={i}
                    className="orbit-item absolute flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-midnight/80 text-teal-200/80"
                    style={{ left: `${x}%`, top: `${y}%`, translate: "-50% -50%" }}
                  >
                    <I size={16} />
                  </span>
                );
              })}
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <h2 className="mt-8 font-display text-4xl font-semibold tracking-wide text-ink">
            Stop wondering. Start knowing.
          </h2>
        </Reveal>
        <Reveal delay={0.28}>
          <p className="mt-4 text-mist">Free to start. Sign up once. Results in seconds.</p>
        </Reveal>
        <Reveal delay={0.4}>
          <GlowLink to="/detect" className="mt-8">
            Scan something now
          </GlowLink>
        </Reveal>
      </section>
    </div>
  );
}
