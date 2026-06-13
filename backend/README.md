# AI Content Detection — Backend

FastAPI service implementing the layered evidence pipeline from `../ARCHITECTURE.md`.

## Layers

| Layer | Module | Cost | What it does |
|---|---|---|---|
| L1 Provenance | `pipeline/l1_provenance.py` | free | C2PA / Content Credentials manifest verification (only conclusive layer) |
| L2 Metadata | `pipeline/l2_metadata.py` | free | EXIF/XMP/PNG-chunk analysis: AI tool fingerprints vs camera evidence |
| L3 Forensics | `pipeline/l3_forensics.py` | free | ELA, noise residual, FFT spectral slope (weak hints only) |
| L4 Vision | `pipeline/l4_vision.py` | ~$0.001/img | Claude Haiku visual anomaly check (skipped without API key) |
| L5 Verdict | `pipeline/l5_verdict.py` | ~$0.003/img | Claude Sonnet evidence aggregation; deterministic rule fallback |

## Services (all optional — graceful degradation)

| Service | Env vars | Without it |
|---|---|---|
| Anthropic | `ANTHROPIC_API_KEY` | Free layers + rule-based verdict (`engine: "rules"`) |
| Supabase | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | In-memory report cache; `/v1/history` → 501 |
| Upstash Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | In-process rate limiting (resets on restart) |

Setup: copy `.env.example` → `.env`, fill what you have. `GET /healthz`
shows which services are live.

## Migrations

Schema lives in `migrations/*.sql`, applied in filename order and tracked
in `public.schema_migrations` (each file runs exactly once):

```bash
scripts/migrate.sh --status    # applied vs pending
scripts/migrate.sh             # apply pending (single transaction each)
scripts/migrate.sh --baseline  # mark all applied WITHOUT running
                               # (one-time, if you previously ran SQL by hand)
```

Needs `SUPABASE_DB_URL` in `.env` (Dashboard → Connect → Session pooler URI)
and `psql` (`brew install libpq`). New schema change = new `NNNN_name.sql`
file — never edit an applied migration.

## Cost & abuse controls (ARCHITECTURE.md §5)

- Hash cache before any paid call — repeat images are free and don't burn quota.
- Daily quotas: anonymous 5/day per IP, signed-in 25/day (override via
  `RATE_LIMIT_ANON_DAILY` / `RATE_LIMIT_USER_DAILY`; dev `.env` sets generous values).
- `CLAUDE_DAILY_CALL_BUDGET` kill-switch: once today's Claude-spending analyses
  hit the cap, the pipeline silently downgrades to the free rules engine.
- Rate limiter fails open — a broken Redis never blocks analysis.

## Run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # then fill in the credentials you have

uvicorn app.main:app --reload
# Swagger UI: http://127.0.0.1:8000/docs
```

## API

```
POST /v1/analyze        multipart image (+ optional Authorization: Bearer <supabase jwt>)
GET  /v1/report/{id}    full forensic report
GET  /v1/history        signed-in user's past checks (requires Supabase)
GET  /healthz           service status flags
```

## Try it

```bash
curl -F "file=@some_image.jpg;type=image/jpeg" http://127.0.0.1:8000/v1/analyze | python -m json.tool
```

## Test

```bash
pytest tests/ -v
```

## Notes

- `c2pa-python` is optional; if not installed, L1 reports `skipped`.
- L3 thresholds are uncalibrated starting points. Calibrate against a labeled set
  (real photos vs Midjourney/SDXL/Flux output) before trusting them.
