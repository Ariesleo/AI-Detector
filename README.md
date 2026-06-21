# AI-Detector (Veritas)

Evidence-based AI content detection. Upload an image — a layered forensic
pipeline gathers evidence and returns a confidence-scored verdict, never a
binary "fake/real" claim.

> Truth still exists. We help you find it.

## Structure

| Folder | What it is | Stack |
|---|---|---|
| [`backend/`](backend/) | Layered detection pipeline + API (L1 C2PA provenance → L2 metadata → L3 forensics → L4 Claude vision → L5 verdict), Supabase persistence, rate limiting | FastAPI · Python |
| [`web/`](web/) | **Primary app** — marketing site + detection playground. Responsive and installable as a PWA (offline shell, add-to-home-screen on iOS/Android). Path to App Store / Play Store is to wrap this build with Capacitor — not a second codebase. | React · Vite · TypeScript · Tailwind · Framer Motion |
| [`mobile/`](mobile/) | _Parked._ Original React Native + Expo shell, superseded by the responsive web app + PWA. Revisit only if native share-intent becomes a priority Capacitor can't cover. | React Native · Expo |

Docs: [`ARCHITECTURE.md`](ARCHITECTURE.md) (technical design) ·
[`PRODUCT_SPEC.md`](PRODUCT_SPEC.md) (product/design source of truth)

## Quick start

```bash
# backend — terminal 1
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in what you have; everything degrades gracefully
uvicorn app.main:app --reload

# web — terminal 2
cd web
npm install
npm run dev            # open http://localhost:5173
# npm run build && npm run preview   # serves the installable PWA (the service worker is build-only)
```

The web app is mobile-responsive and installable to the home screen on phones
and desktop. iOS/Android store builds, when needed, come from wrapping this same
build with [Capacitor](https://capacitorjs.com/) — see [`ARCHITECTURE.md`](ARCHITECTURE.md) §3.

Without any credentials the pipeline still works: free forensic layers +
rule-based verdict. Add `ANTHROPIC_API_KEY` for Claude vision/reasoning,
Supabase for persistence/auth/history, Upstash for cross-instance rate
limiting — see [`backend/.env.example`](backend/.env.example).
