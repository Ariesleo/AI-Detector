"""Report persistence + user history.

Supabase Postgres when SUPABASE_URL/SUPABASE_SERVICE_KEY are set (schema
in migrations/, applied via scripts/migrate.sh), in-memory dicts otherwise. The in-memory layer always
fronts Supabase as a per-process hot cache, so repeat hits never leave the box.

Supabase failures are swallowed (logged to the layer note pattern is overkill
here) — a broken DB must never take down analysis.
"""
from __future__ import annotations

import io
import logging

from .config import settings
from .models import AnalysisReport

logger = logging.getLogger(__name__)

THUMB_BUCKET = "scan-thumbnails"
THUMB_MAX_DIM = 320
THUMB_SIGN_TTL = 3600  # seconds

_memory_by_hash: dict[str, AnalysisReport] = {}
_memory_by_id: dict[str, AnalysisReport] = {}

_client = None


def supabase_enabled() -> bool:
    return bool(settings.supabase_url and settings.supabase_service_key)


def _supabase():
    """Lazy singleton Supabase client; None when not configured/installed."""
    global _client
    if not supabase_enabled():
        return None
    if _client is None:
        try:
            from supabase import create_client

            _client = create_client(settings.supabase_url, settings.supabase_service_key)
        except Exception as exc:  # pragma: no cover - import/config errors
            logger.warning("Supabase client unavailable: %s", exc)
            return None
    return _client


def get_by_hash(sha256: str) -> AnalysisReport | None:
    if sha256 in _memory_by_hash:
        return _memory_by_hash[sha256]
    sb = _supabase()
    if sb is None:
        return None
    try:
        rows = sb.table("reports").select("report").eq("sha256", sha256).limit(1).execute().data
    except Exception as exc:
        logger.warning("Supabase get_by_hash failed: %s", exc)
        return None
    if not rows:
        return None
    report = AnalysisReport.model_validate(rows[0]["report"])
    _memory_by_hash[sha256] = report
    _memory_by_id[report.report_id] = report
    return report


def get_by_id(report_id: str) -> AnalysisReport | None:
    if report_id in _memory_by_id:
        return _memory_by_id[report_id]
    sb = _supabase()
    if sb is None:
        return None
    try:
        rows = sb.table("reports").select("report").eq("report_id", report_id).limit(1).execute().data
    except Exception as exc:
        logger.warning("Supabase get_by_id failed: %s", exc)
        return None
    if not rows:
        return None
    report = AnalysisReport.model_validate(rows[0]["report"])
    _memory_by_hash[report.sha256] = report
    _memory_by_id[report_id] = report
    return report


def save(report: AnalysisReport) -> None:
    _memory_by_hash[report.sha256] = report
    _memory_by_id[report.report_id] = report
    sb = _supabase()
    if sb is None:
        return
    try:
        sb.table("reports").upsert(
            {
                "sha256": report.sha256,
                "report_id": report.report_id,
                "verdict": report.verdict.value,
                "report": report.model_dump(mode="json"),
            },
            on_conflict="sha256",
        ).execute()
    except Exception as exc:
        logger.warning("Supabase save failed: %s", exc)


def record_history(workspace_id: str, user_id: str, report: AnalysisReport) -> None:
    """One row per check run inside a workspace (cache hits included)."""
    sb = _supabase()
    if sb is None:
        return
    try:
        sb.table("history").insert(
            {
                "workspace_id": workspace_id,
                "user_id": user_id,
                "report_id": report.report_id,
                "sha256": report.sha256,
                "verdict": report.verdict.value,
                "confidence": report.confidence,
            }
        ).execute()
    except Exception as exc:
        logger.warning("Supabase record_history failed: %s", exc)


def get_history(workspace_id: str, limit: int = 50) -> list[dict]:
    sb = _supabase()
    if sb is None:
        return []
    try:
        rows = (
            sb.table("history")
            .select("report_id, sha256, verdict, confidence, created_at")
            .eq("workspace_id", workspace_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
            .data
        )
    except Exception as exc:
        logger.warning("Supabase get_history failed: %s", exc)
        return []

    # Attach short-lived signed thumbnail URLs (signed-in opt-in storage).
    if rows:
        paths = [f"{workspace_id}/{r['report_id']}.jpg" for r in rows]
        signed = _signed_thumbnails(sb, paths)
        for r in rows:
            r["thumb_url"] = signed.get(f"{workspace_id}/{r['report_id']}.jpg")
    return rows


# ---------- thumbnails (opt-in, signed-in users only) ----------

def save_thumbnail(workspace_id: str, report_id: str, image_bytes: bytes) -> None:
    """Downscale + store a private thumbnail at {workspace_id}/{report_id}.jpg.

    Best-effort and image-only: failures (non-image upload, storage outage)
    are logged, never raised — history works without the picture.
    """
    sb = _supabase()
    if sb is None:
        return
    try:
        from PIL import Image

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img.thumbnail((THUMB_MAX_DIM, THUMB_MAX_DIM), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=80)
        sb.storage.from_(THUMB_BUCKET).upload(
            f"{workspace_id}/{report_id}.jpg",
            buf.getvalue(),
            {"content-type": "image/jpeg", "upsert": "true"},
        )
    except Exception as exc:
        logger.info("thumbnail save skipped: %s", exc)


def _signed_thumbnails(sb, paths: list[str]) -> dict[str, str]:
    """Batch signed URLs; missing objects simply map to nothing."""
    try:
        results = sb.storage.from_(THUMB_BUCKET).create_signed_urls(paths, THUMB_SIGN_TTL)
    except Exception as exc:
        logger.info("signed thumbnail urls failed: %s", exc)
        return {}
    out: dict[str, str] = {}
    for item in results or []:
        if item.get("error"):
            continue
        url = item.get("signedURL") or item.get("signedUrl")
        path = item.get("path")
        if url and path:
            out[path] = url
    return out


# ---------- workspaces (docs/TENANCY.md) ----------

def get_personal_workspace(user_id: str) -> dict | None:
    """The user's default workspace context (created by signup trigger)."""
    sb = _supabase()
    if sb is None:
        return None
    try:
        rows = (
            sb.table("workspaces")
            .select("id, name, kind, plan, workspace_members!inner(user_id, role)")
            .eq("workspace_members.user_id", user_id)
            .execute()
            .data
        )
    except Exception as exc:
        logger.warning("Supabase get_personal_workspace failed: %s", exc)
        return None
    if not rows:
        return None
    return next((r for r in rows if r["kind"] == "personal"), rows[0])


def get_workspace_if_member(user_id: str, workspace_id: str) -> dict | None:
    """The workspace, but only if the user belongs to it."""
    sb = _supabase()
    if sb is None:
        return None
    try:
        rows = (
            sb.table("workspaces")
            .select("id, name, kind, plan, workspace_members!inner(user_id, role)")
            .eq("id", workspace_id)
            .eq("workspace_members.user_id", user_id)
            .limit(1)
            .execute()
            .data
        )
        return rows[0] if rows else None
    except Exception as exc:
        logger.warning("Supabase get_workspace_if_member failed: %s", exc)
        return None


def record_usage(workspace_id: str, user_id: str | None, engine: str, llm_used: bool) -> None:
    """Metering row per fresh analysis — the billing source of truth later."""
    sb = _supabase()
    if sb is None:
        return
    try:
        sb.table("usage_events").insert(
            {
                "workspace_id": workspace_id,
                "user_id": user_id,
                "engine": engine,
                "llm_used": llm_used,
            }
        ).execute()
    except Exception as exc:
        logger.warning("Supabase record_usage failed: %s", exc)
