# AI Content Detection — Architecture (Phase 1: Images)

**Goal:** Cross-platform tool (web, iOS, Android) that analyzes images for signs of AI generation or manipulation, using free/deterministic forensic layers plus the Claude API as the reasoning layer. No model training, no GPU servers, no fixed infrastructure cost.

**Audience:** General public (simple verdict) and journalists/fact-checkers (detailed evidence report). Same pipeline, two presentation modes.

---

## 1. Core design principle

No single check can prove an image is AI-generated. The product never outputs a binary "AI / Not AI." It outputs a **confidence level + evidence list**. Claude does not "detect" — it aggregates deterministic signals and writes the explanation. This is what keeps the tool defensible without paid detector APIs.

Verdict scale: `Verified authentic` (signed provenance) → `Likely authentic` → `Inconclusive` → `Likely AI/manipulated` → `Confirmed AI` (signed AI provenance, e.g., DALL·E C2PA manifest).

## 2. Pipeline

```
Client (web app / installable PWA)
  └─ upload image ──► API Gateway (serverless)
        ├─ SHA-256 hash ──► cache hit? return cached report
        ├─ [parallel]
        │   ├─ L1 Provenance: C2PA manifest verify (c2pa-node)
        │   ├─ L2 Metadata:   EXIF/XMP/IPTC parse (exiftool); AI-tool
        │   │                 signatures (SD "parameters" chunk, Midjourney
        │   │                 XMP, missing camera data)
        │   ├─ L3 Forensics:  Error Level Analysis, noise-residual map,
        │   │                 FFT frequency artifacts, JPEG quantization
        │   │                 fingerprint (Pillow/NumPy/OpenCV)
        │   └─ L4 Vision:     Claude vision pass — semantic anomalies
        │                     (hands, text, reflections, physics)
        ├─ L5 Reasoning: Claude (structured output) — weigh all signals,
        │                produce verdict + confidence + evidence list
        └─ store report (hash-keyed) ──► return JSON
```

**L3 runs first as cheap filters; L4/L5 are the only paid calls (~$0.002–0.01 per image with Haiku/Sonnet).** Cache by content hash so viral images are analyzed once.

Reverse image search (catching real-but-miscaptioned photos — the most common misinformation): no free API exists. Workaround: the report includes one-tap deep links to Google Lens / TinEye so the user runs it manually. Revisit if budget appears.

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Client | **React + Vite + Tailwind** (web), installable as a PWA | Web-first: one responsive codebase ships to every browser and installs to the home screen on iOS/Android. App Store / Play Store builds, when needed, come from wrapping this same build with **Capacitor** — not a second codebase. (Supersedes the original Expo plan; see `mobile/`, now parked.) |
| Share intent | Capacitor share-target plugin (deferred) | "Share to app" from WhatsApp/Twitter — the killer UX; lands with the Capacitor wrapper, not before. |
| API | **Python on AWS Lambda** (or Railway/Fly free tier) via FastAPI + Mangum | Forensics needs Pillow/NumPy/OpenCV — Python-native. Scales to zero. |
| Provenance | `c2pa-python` / `c2pa-node` | Official CAI SDK, free |
| Metadata | `pyexiftool` / `piexif` | Industry standard |
| AI reasoning | **Claude API** — Haiku for L4 vision triage, Sonnet for L5 report | Cost control: Haiku ≈ $0.001/image |
| Auth + DB + storage | **Supabase** (free tier) | Postgres (report cache, user history), auth, file storage in one |
| Rate limiting | Upstash Redis (free tier) | Per-IP/user caps to bound Claude spend |
| CI/CD | GitHub Actions + EAS | Free for public repos |

Fixed monthly cost: **$0**. Variable: Claude tokens only (~$1 per 500–1000 checks).

## 4. API design

```
POST /v1/analyze        multipart image → { report_id, verdict, confidence,
                        evidence[], layers{}, mode: simple|detailed }
GET  /v1/report/{id}    full forensic report (fact-checker mode)
GET  /v1/history        user's past checks (auth required)
```

Evidence item shape:
```json
{ "layer": "metadata", "signal": "no_camera_exif",
  "direction": "ai", "weight": "medium",
  "explanation": "No camera make/model or capture settings found." }
```

L5 Claude call uses **structured outputs / tool-use schema** so the verdict JSON is machine-parseable — never free text parsed by regex.

## 5. Cost & abuse controls

- Hash cache before any paid call (viral images = near-free).
- Downscale to ≤1568px before Claude vision (token cap).
- Anonymous: 5 checks/day per IP. Free account: 25/day. Hard daily Claude budget kill-switch.
- Strip and never store user images beyond analysis unless user opts into history.

## 6. Honest limitations (state these in-app)

- Without trained detector models, a skilled actor who strips metadata and adds camera-like noise will likely get "Inconclusive." That is the correct output, not a bug.
- Screenshots destroy metadata/provenance — most social-media images arrive as screenshots, so L1/L2 often yield nothing and L3/L4 carry the weight.
- False accusation risk: UI must say "signals suggest," never "this is fake."

## 7. Roadmap

| Phase | Scope |
|---|---|
| 1 | Images: pipeline above, responsive web + installable PWA, then Capacitor app-store builds |
| 2 | Audio files: metadata + spectrogram analysis + Claude reasoning (weaker without detector APIs — set expectations) |
| 3 | Video: keyframe extraction → reuse image pipeline per frame |
| 4 | Live calls: **not feasible** without specialized vendors (Pindrop-class); revisit only with budget |

## 8. Build order (Phase 1)

1. FastAPI service with L1–L3 (no Claude yet) — pure free forensics, testable locally.
2. Add Claude L4 vision + L5 structured verdict; calibrate weights on a test set (Midjourney/SDXL/Flux samples vs. real photos).
3. Supabase cache + rate limiting.
4. Web app: upload, simple/detailed report views; make it responsive + installable (PWA).
5. Deploy: Lambda (API) + static web host. Wrap the web build with Capacitor for TestFlight/Play internal track when store presence is needed.
