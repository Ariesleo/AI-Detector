# AI-Detector (Veritas)

Evidence-based AI content detection. Upload an image — a layered forensic
pipeline gathers evidence and returns a confidence-scored verdict, never a
binary "fake/real" claim.

> Truth still exists. We help you find it.

## Structure

| Folder | What it is | Stack |
|---|---|---|
| [`backend/`](backend/) | Layered detection pipeline + API (L1 C2PA provenance → L2 metadata → L3 forensics → L4 Claude vision → L5 verdict), Supabase persistence, rate limiting | FastAPI · Python |
| [`web/`](web/) | Veritas web app — marketing site + detection playground | React · Vite · TypeScript · Tailwind · Framer Motion |
| [`mobile/`](mobile/) | Cross-platform app (iOS/Android/web), future share-intent entry path | React Native · Expo |

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
```

Without any credentials the pipeline still works: free forensic layers +
rule-based verdict. Add `ANTHROPIC_API_KEY` for Claude vision/reasoning,
Supabase for persistence/auth/history, Upstash for cross-instance rate
limiting — see [`backend/.env.example`](backend/.env.example).
