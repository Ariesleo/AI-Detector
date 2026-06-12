# Veritas — Product Specification & UI Design Brief

One document describing what we're building, why, what exists today, and everything the UI must express. Companion to `ARCHITECTURE.md` (technical) — this file is the product/design source of truth.

---

## 1. What we're building

**Veritas** is a cross-platform tool (web, iOS, Android — one Expo codebase) that analyzes media for signs of AI generation or manipulation. A user submits an image; a layered forensic pipeline gathers evidence; the app presents an **evidence-based verdict** — never a binary "fake/real" claim.

**Core product principle (drives every UI decision):**
No technology can *prove* an arbitrary image is AI-generated. The product's honesty is its differentiator. The UI must always communicate *degree of confidence + the evidence behind it*, and must make "Inconclusive" feel like a legitimate, useful answer — not a failure.

## 2. Users & modes

| User | Need | UI mode |
|---|---|---|
| General public | "Is this WhatsApp/Twitter image real?" Fast, simple, plain language | **Simple mode** (default): verdict card + short summary |
| Journalists / fact-checkers | Defensible evidence they can cite | **Detailed mode** (toggle): full evidence list, per-layer diagnostics, raw values, hashes |

Same pipeline and report — two presentation depths. Mode is a toggle on the report screen (later: a persistent preference).

## 3. How detection works (what the UI is visualizing)

Five layers run on every image. Each emits zero or more **evidence signals**.

| # | Layer | What it checks | Can it be conclusive? |
|---|---|---|---|
| L1 | **Provenance** | C2PA / Content Credentials — cryptographically signed manifests from AI generators (DALL·E, Firefly) or cameras | **Yes — the only one.** Signed AI manifest = confirmed AI; signed capture chain = verified authentic |
| L2 | **Metadata** | EXIF camera data, Stable Diffusion parameter chunks, AI software fingerprints, IPTC AI labels | High weight, not conclusive (metadata is forgeable/strippable) |
| L3 | **Forensics** | Error-level analysis, sensor-noise residual, frequency-spectrum slope | Low weight only — weak statistical hints |
| L4 | **Vision** (Claude) | Semantic anomalies: hands, garbled text, impossible shadows/reflections, "AI sheen" | Medium weight max |
| L5 | **Reasoning** (Claude) | Weighs all signals, writes the verdict + plain-language summary | — (aggregator) |

Key nuance the UI must handle: **screenshots strip L1/L2 evidence.** Most social-media images arrive as screenshots, so "no metadata found" is the most common case and must not look alarming.

## 4. The data the UI receives

`POST /v1/analyze` returns one `AnalysisReport`:

```ts
{
  report_id: string,
  sha256: string,
  verdict: "verified_authentic" | "likely_authentic" | "inconclusive"
         | "likely_ai" | "confirmed_ai",
  confidence: number,          // 0–1
  summary: string,             // 2–4 plain-language sentences citing evidence
  evidence: EvidenceItem[],    // the heart of the UI
  layers: { [name]: LayerResult },  // diagnostics for detailed mode
  engine: "claude" | "rules",  // which aggregator produced the verdict
  cached: boolean
}

EvidenceItem = {
  layer: "provenance" | "metadata" | "forensics" | "vision",
  signal: string,              // snake_case id, e.g. "sd_generation_params"
  direction: "ai" | "authentic" | "neutral",
  weight: "low" | "medium" | "high" | "conclusive",
  explanation: string          // one sentence, already user-readable
}

LayerResult = {
  name: string,
  status: "ok" | "skipped" | "error",   // skipped = e.g. no API key for vision
  evidence: EvidenceItem[],
  raw: object,                 // numbers for detailed mode (ELA stats, FFT slope…)
  note: string | null
}
```

## 5. Verdict system (the UI's centerpiece)

Five states. Current palette is a starting point — redesign freely, but keep the *semantic ordering* and don't make "inconclusive" look like an error.

| Verdict | Meaning | Current color | Tone to convey |
|---|---|---|---|
| `verified_authentic` | Signed capture history exists | green #15803d | Strong reassurance, rare badge-of-honor |
| `likely_authentic` | Signals consistent with real photo | soft green #16a34a | Calm confidence, not a guarantee |
| `inconclusive` | Not enough evidence either way | slate #64748b | Neutral, legitimate, "stay normally skeptical" |
| `likely_ai` | Multiple signals point to AI | orange #ea580c | Caution, not condemnation |
| `confirmed_ai` | Signed AI provenance | red #dc2626 | Certainty (the only certain negative) |

Always shown with verdict: **confidence bar** (0–100%) and **summary text**.
Language rules baked into the product: "signals suggest," never "this is fake." False accusations harm real photographers.

## 6. Screens — current + planned

### Built today (functional, undesigned)

**S1. Home / Analyze**
- Image preview area (empty state: "No image selected")
- Actions: Choose Image, Take Photo (native only), Analyze (primary, disabled until image picked)
- Busy state: spinner in the Analyze button (analysis takes 1–8s depending on Claude layers)
- Error state: inline message (server unreachable, unsupported type, >15MB)
- Persistent honesty disclaimer (small print): results are estimates, not proof

**S2. Report**
- Analyzed image thumbnail
- **Verdict card**: verdict label, confidence bar, plain-language summary
- **Evidence list**: one row per signal — direction indicator (▲ ai / ▼ authentic / • neutral), signal name, weight chip, explanation sentence, source layer
- **Detailed mode toggle** reveals: per-layer diagnostic cards (status ok/skipped/error, raw numbers as JSON), engine + sha256 + cached metadata
- "Analyze Another Image" action

### Planned (design ahead of build)

**S3. History** (needs Supabase) — past checks: thumbnail, verdict chip, date; tap → report. Anonymous users: none or local-only.

**S4. Share-intent entry** (dev build) — user shares an image from WhatsApp/Twitter directly into the app → lands on a "analyzing…" transition → report. *This will be the #1 entry path; design the analyzing/transition state well.*

**S5. Onboarding (first launch, 2–3 cards)** — what the tool can and cannot do. Sets the honesty contract: "We look for evidence. Sometimes the honest answer is 'can't tell.'"

**S6. Manual verification helpers** — report screen section linking out to Google Lens / TinEye reverse-image search (no free API exists; we deep-link instead). Design as "extra steps you can take."

**S7. Settings** — API endpoint (dev), default mode, later: account/auth.

### Future phases (directional, don't design yet)
- Phase 2: audio file analysis (same report pattern, audio player instead of image)
- Phase 3: video (keyframe-by-keyframe verdicts — timeline UI)
- Phase 4: live-call detection (not feasible without paid vendors; parked)

## 7. UX states checklist (every one needs a design)

- Empty home (no image)
- Image selected, ready
- Analyzing (1–8s; consider staged progress: "Checking provenance… reading metadata… forensic scan… visual inspection…")
- Report: each of the 5 verdicts
- Report with zero evidence signals (rare but possible → inconclusive)
- Report where layers were skipped (no Claude key → vision "skipped"; engine: "rules") — detailed mode shows why
- Cached result (instant return; subtle "previously analyzed" indicator)
- Errors: server unreachable, file too large (>15MB), unsupported format, rate-limited (future)
- Offline (native)

## 8. Design principles

1. **Evidence is the product.** The verdict is a headline; the evidence rows are the story. Make them scannable, not buried.
2. **Calibrated, not dramatic.** No scary skull icons, no "FAKE DETECTED" stamps. This is a measurement instrument, not a tabloid.
3. **Inconclusive is a first-class result.** Visually neutral, with guidance on what the user can still do (S6 links).
4. **Two audiences, one screen.** Simple mode must fit one viewport; detailed mode can scroll forever.
5. **Trust through transparency.** Show what was checked AND what couldn't be checked.
6. **Mobile-first, web-equal.** Max content width ~640px keeps web layouts honest.

## 9. Current implementation status

| Piece | Status |
|---|---|
| Backend pipeline L1–L5 (FastAPI) | ✅ built, 7/7 tests pass |
| Rule-based verdict (no API key needed) | ✅ working |
| Claude vision + reasoning layers | ✅ built, activates with `ANTHROPIC_API_KEY` |
| Expo app S1 + S2 | ✅ functional, default styling — awaiting your design |
| Hash cache | ✅ in-memory (Supabase persistence pending) |
| Auth, history, rate limits | ⬜ pending (Supabase + Upstash) |
| Share-intent, onboarding | ⬜ pending |
| L3 threshold calibration vs real dataset | ⬜ pending |

## 10. Naming

Working name **"Veritas"** (used in app config). Open to change — verdict-system and language rules above are the binding parts, not the name.
