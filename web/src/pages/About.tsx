import { GlowLink } from "../components/GlowButton";
import { Reveal } from "../components/Reveal";

const ROADMAP = [
  { phase: "Now", title: "Image detection", desc: "The full layered pipeline — provenance, metadata, forensics, and AI reasoning — live today.", live: true },
  { phase: "Next", title: "Audio & call detection", desc: "Spectrogram analysis and voice-clone fingerprints, built for the calls that target families.", live: false },
  { phase: "Coming", title: "Video detection", desc: "Keyframe extraction with temporal consistency checks across frames.", live: false },
  { phase: "Coming", title: "Document detection", desc: "Metadata forensics, font pattern analysis, and signature geometry for PDFs and Word files.", live: false },
];

export function About() {
  return (
    <div className="mx-auto max-w-3xl px-5">
      {/* opening */}
      <div className="pt-12">
        <Reveal>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-wide text-ink sm:text-5xl">
            We built this because people are being hurt.
          </h1>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-8 text-lg leading-relaxed text-mist">
            AI fraud is not a future problem. Older adults lose their savings to
            phone calls from voices cloned off ten seconds of social media audio.
            Journalists publish images of events that never happened. Businesses
            wire money against invoices that were never written by a human.
            Reported losses run to billions of dollars a year — and most victims
            never report at all.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <p className="mt-6 text-lg leading-relaxed text-ink/90">
            We believe technology that creates deception must be matched by
            technology that reveals it.{" "}
            <span className="text-teal-200">That is why we built Veritas.</span>
          </p>
        </Reveal>
      </div>

      {/* mission */}
      <div className="mt-24">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold tracking-wide text-ink">
            The mission
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="glass mt-5 rounded-3xl p-7 text-lg leading-relaxed text-mist">
            Make truth accessible to everyone. Free, fast, and requiring no
            technical knowledge.{" "}
            <span className="text-ink">
              If you can upload a file, you can know the truth about it.
            </span>
          </p>
        </Reveal>
      </div>

      {/* roadmap */}
      <div className="mt-24">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold tracking-wide text-ink">
            Where this is going
          </h2>
        </Reveal>
        <div className="relative mt-8 space-y-8 border-l border-white/10 pl-8">
          {ROADMAP.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.14}>
              <div className="relative">
                <span
                  className={`absolute -left-[37px] top-1.5 h-2.5 w-2.5 rounded-full ${
                    r.live
                      ? "bg-real shadow-[0_0_12px_rgba(0,255,136,0.7)]"
                      : "bg-white/20"
                  }`}
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal-200/70">
                  {r.phase}
                </span>
                <h3 className="mt-1 font-display text-lg font-semibold text-ink">
                  {r.title}
                </h3>
                <p className="mt-1.5 leading-relaxed text-mist">{r.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* the builder */}
      <div className="mt-24">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold tracking-wide text-ink">
            The builder
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-5 text-lg leading-relaxed text-mist">
            Veritas is built by a master&apos;s student in data science in Ohio.
            Saw the problem up close. Built the solution. Believes everyone —
            not just experts with forensic tools — deserves access to truth.
          </p>
        </Reveal>
      </div>

      {/* hope, always */}
      <div className="mt-28 text-center">
        <Reveal>
          <p className="font-display text-2xl leading-relaxed text-ink/90">
            The fakes will keep getting better.
            <br />
            <span className="text-teal-200">So will we.</span>
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <GlowLink to="/detect" className="mt-10">
            See it work
          </GlowLink>
        </Reveal>
      </div>
    </div>
  );
}
