import { motion } from "framer-motion";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GlowLink } from "../components/GlowButton";
import { Reveal } from "../components/Reveal";

/* ---------- animated diagrams ---------- */

function ImageDiagram() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* real photo: organic gradient */}
      <div className="relative h-44 overflow-hidden rounded-2xl border border-white/10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 35%, rgba(94,160,190,0.55), rgba(20,35,60,0.85) 70%)",
          }}
        />
        <span className="absolute bottom-2 left-3 font-mono text-[10px] text-real/90">REAL — natural 1/f frequency falloff</span>
      </div>
      {/* AI image: telltale periodic grid */}
      <div className="relative h-44 overflow-hidden rounded-2xl border border-uncertain/30">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 40%, rgba(150,120,200,0.5), rgba(25,18,50,0.85) 70%)",
          }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,179,0,0.16) 0 1px, transparent 1px 9px), repeating-linear-gradient(90deg, rgba(255,179,0,0.16) 0 1px, transparent 1px 9px)",
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 3.2, repeat: Infinity }}
        />
        <span className="absolute bottom-2 left-3 font-mono text-[10px] text-uncertain">AI — periodic upsampling artifacts</span>
      </div>
    </div>
  );
}

function VoiceDiagram() {
  const human = "M0 30 Q 8 8 16 26 T 32 22 Q 38 44 46 28 T 62 34 Q 70 12 78 30 T 94 26 Q 100 38 108 28 T 124 32 Q 132 16 140 30";
  const clone = "M0 30 Q 10 14 20 30 T 40 30 Q 50 14 60 30 T 80 30 Q 90 14 100 30 T 120 30 Q 130 14 140 30";
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="relative rounded-2xl border border-white/10 p-4">
        <svg viewBox="0 0 140 60" className="w-full">
          <path d={human} fill="none" stroke="rgba(0,255,136,0.7)" strokeWidth="1.5" />
        </svg>
        <span className="font-mono text-[10px] text-real/90">HUMAN — irregular, breathy, imperfect</span>
      </div>
      <div className="relative rounded-2xl border border-uncertain/30 p-4">
        <svg viewBox="0 0 140 60" className="w-full">
          <path d={clone} fill="none" stroke="rgba(255,179,0,0.8)" strokeWidth="1.5" />
          <motion.rect
            x="38" y="6" width="24" height="48" rx="3"
            fill="rgba(255,179,0,0.12)" stroke="rgba(255,179,0,0.45)" strokeWidth="0.8"
            animate={{ x: [18, 78, 18] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
        <span className="font-mono text-[10px] text-uncertain">CLONED — too periodic, no micro-tremor</span>
      </div>
    </div>
  );
}

function VideoDiagram() {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className={`h-16 w-10 rounded-lg border sm:h-20 sm:w-20 ${
            i === 2 ? "border-uncertain/70" : "border-white/15"
          }`}
          style={{
            background:
              i === 2
                ? "linear-gradient(160deg, rgba(255,179,0,0.18), rgba(25,18,50,0.7))"
                : "linear-gradient(160deg, rgba(60,90,120,0.3), rgba(15,25,45,0.7))",
          }}
          animate={i === 2 ? { opacity: [1, 0.55, 1] } : undefined}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          <span className="block p-1.5 font-mono text-[9px] text-faint">f{i + 1}</span>
        </motion.div>
      ))}
    </div>
  );
}

function DocDiagram() {
  const rows = [
    ["Producer", "Microsoft Word", "real"],
    ["Producer", "(missing)", "ai"],
    ["Created", "2021-03-14 09:12", "real"],
    ["Created", "1969-12-31 23:59", "ai"],
  ] as const;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      {rows.map(([k, v, kind], i) => (
        <div
          key={i}
          className={`flex justify-between px-4 py-2.5 font-mono text-xs ${
            i % 2 ? "bg-white/[0.02]" : ""
          }`}
        >
          <span className="text-faint">{k}</span>
          <span className={kind === "ai" ? "text-uncertain" : "text-mist"}>{v}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- sections ---------- */

const SECTIONS = [
  {
    id: "images",
    title: "Images",
    diagram: <ImageDiagram />,
    body: [
      "A real photograph carries the fingerprint of physics: sensor noise scattered like grain, light that falls off naturally, frequencies that follow the same power law as everything in nature.",
      "AI generators leave different traces — periodic patterns from upsampling, regions that are too smooth, backgrounds where geometry quietly stops making sense, shadows that disagree with their light sources. Veritas reads the pixels, the frequencies, and the metadata together.",
    ],
  },
  {
    id: "audio",
    title: "Voice & audio calls",
    diagram: <VoiceDiagram />,
    body: [
      "A human voice is beautifully imperfect. Micro-tremors, breath, the tiny instabilities of a real throat — they show up in the waveform as irregularity that no clone reproduces exactly.",
      "This matters because voice scams target the people we love most. A cloned voice says 'Grandma, I need help' — and it sounds right. Detection looks for the frequencies no human throat can produce, the periodicity that is too perfect, the silence with no room tone. Told warmly: if a call feels wrong, it costs nothing to check.",
    ],
  },
  {
    id: "videos",
    title: "Videos",
    diagram: <VideoDiagram />,
    body: [
      "Video is just images under time pressure — and time is hard to fake. Veritas extracts keyframes and analyzes each one, then compares them across time.",
      "Deepfakes flicker in ways real footage doesn't: identity drifting between frames, lighting that resets, details that pop in and out. Temporal inconsistency is the tell.",
    ],
  },
  {
    id: "documents",
    title: "Documents",
    diagram: <DocDiagram />,
    body: [
      "Forged PDFs and contracts often pass a visual read while failing a structural one. Creation timestamps that predate the software that made them. Producer fields that are missing or impossible. Fonts that switch mid-signature.",
      "Veritas compares the document's metadata story against its visible story — and flags every place they disagree.",
    ],
  },
];

export function HowItWorks() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <div className="mx-auto max-w-4xl px-5">
      <div className="pt-10 text-center">
        <Reveal>
          <h1 className="font-display text-4xl font-semibold tracking-wide text-ink sm:text-5xl">
            How Veritas sees through fakes
          </h1>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-mist">
            Every kind of synthetic content leaves its own kind of evidence.
            Here is what we look for — in plain language.
          </p>
        </Reveal>
      </div>

      <div className="mt-12 space-y-16 sm:mt-20 sm:space-y-24">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28">
            <Reveal>
              <h2 className="font-display text-2xl font-semibold tracking-wide text-ink sm:text-3xl">
                {s.title}
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="glass mt-6 rounded-3xl p-6">{s.diagram}</div>
            </Reveal>
            {s.body.map((p, i) => (
              <Reveal key={i} delay={0.2 + i * 0.1}>
                <p className="mt-5 leading-relaxed text-mist">{p}</p>
              </Reveal>
            ))}
            <Reveal delay={0.4}>
              <p className="mt-5 font-display text-teal-200/90">
                Veritas detects all of this — automatically.
              </p>
            </Reveal>
          </section>
        ))}
      </div>

      <div className="mt-16 text-center sm:mt-28">
        <Reveal>
          <p className="text-lg text-mist">
            You don&apos;t need to know any of this to use it.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <GlowLink to="/detect" className="mt-6">
            Scan something now
          </GlowLink>
        </Reveal>
      </div>
    </div>
  );
}
