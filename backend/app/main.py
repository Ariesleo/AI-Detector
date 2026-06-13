"""AI Content Detection API.

Run locally:  uvicorn app.main:app --reload
Docs:         http://127.0.0.1:8000/docs

External services (all optional — see .env.example):
- Supabase: persistent report cache, auth, user history
- Upstash Redis: cross-instance rate limiting + Claude budget kill-switch
"""
from __future__ import annotations

import hashlib

from fastapi import FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import auth, ratelimit, store
from .config import settings
from .models import AnalysisReport
from .pipeline import runner

app = FastAPI(title="AI Content Detection", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to app domains before production
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_MIMES = {"image/jpeg", "image/png", "image/webp", "image/tiff", "image/heic"}


def _client_ip(request: Request) -> str:
    """Real client IP, proxy-aware (Lambda/ALB set X-Forwarded-For)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _resolve_workspace(user_id: str | None, requested_id: str | None) -> dict | None:
    """Workspace context per docs/TENANCY.md: explicit X-Workspace-Id (must be
    a member; 403 otherwise) or the user's personal workspace. None = anonymous."""
    if not user_id or not store.supabase_enabled():
        return None
    if requested_id:
        workspace = store.get_workspace_if_member(user_id, requested_id)
        if workspace is None:
            raise HTTPException(403, "You are not a member of this workspace.")
        return workspace
    return store.get_personal_workspace(user_id)


@app.get("/healthz")
def healthz() -> dict:
    return {
        "ok": True,
        "claude_enabled": bool(settings.anthropic_api_key),
        "gemini_enabled": bool(settings.gemini_api_key),
        "supabase_enabled": store.supabase_enabled(),
        "upstash_enabled": ratelimit.upstash_enabled(),
    }


@app.post("/v1/analyze", response_model=AnalysisReport)
async def analyze(
    request: Request,
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
    x_workspace_id: str | None = Header(default=None, alias="X-Workspace-Id"),
) -> AnalysisReport:
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(415, f"Unsupported type {file.content_type}. Allowed: {sorted(ALLOWED_MIMES)}")
    data = await file.read()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(413, "Image too large (15 MB max).")
    if not data:
        raise HTTPException(400, "Empty upload.")

    user_id = auth.resolve_user_id(authorization)
    workspace = _resolve_workspace(user_id, x_workspace_id)

    # Cache hit costs us nothing — serve it before burning quota.
    sha = hashlib.sha256(data).hexdigest()
    if cached := store.get_by_hash(sha):
        if workspace and user_id:
            store.record_history(workspace["id"], user_id, cached)
        return cached.model_copy(update={"cached": True})

    allowed, remaining = ratelimit.check_quota(_client_ip(request), workspace)
    if not allowed:
        detail = "Daily check limit reached."
        if not user_id:
            detail += " Sign in to raise your limit."
        raise HTTPException(429, detail)

    llm_configured = bool(settings.anthropic_api_key or settings.gemini_api_key)
    use_llm = llm_configured and ratelimit.claude_budget_ok()
    report = runner.analyze(data, mime=file.content_type, use_llm=use_llm)
    if use_llm:
        ratelimit.count_claude_use()

    # Don't cache degraded reports (errored layers, e.g. an LLM outage or
    # billing failure) — the next attempt should re-analyze, not replay them.
    if not any(layer.status == "error" for layer in report.layers.values()):
        store.save(report)
    if workspace and user_id:
        store.record_history(workspace["id"], user_id, report)
        store.record_usage(workspace["id"], user_id, report.engine, use_llm)
    return report


@app.get("/v1/report/{report_id}", response_model=AnalysisReport)
def get_report(report_id: str) -> AnalysisReport:
    report = store.get_by_id(report_id)
    if not report:
        raise HTTPException(404, "Report not found.")
    return report


@app.get("/v1/history")
def get_history(
    authorization: str | None = Header(default=None),
    x_workspace_id: str | None = Header(default=None, alias="X-Workspace-Id"),
) -> list[dict]:
    """The active workspace's past checks, newest first. Requires Supabase."""
    if not store.supabase_enabled():
        raise HTTPException(501, "History requires Supabase (not configured).")
    user_id = auth.resolve_user_id(authorization)
    if not user_id:
        raise HTTPException(401, "Sign in to view history.")
    workspace = _resolve_workspace(user_id, x_workspace_id)
    if workspace is None:
        return []
    return store.get_history(workspace["id"])
