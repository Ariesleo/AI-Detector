"""Report persistence + user history.

Supabase Postgres when SUPABASE_URL/SUPABASE_SERVICE_KEY are set (see
supabase_schema.sql), in-memory dicts otherwise. The in-memory layer always
fronts Supabase as a per-process hot cache, so repeat hits never leave the box.

Supabase failures are swallowed (logged to the layer note pattern is overkill
here) — a broken DB must never take down analysis.
"""
from __future__ import annotations

import logging

from .config import settings
from .models import AnalysisReport

logger = logging.getLogger(__name__)

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


def record_history(user_id: str, report: AnalysisReport) -> None:
    """One row per check an authenticated user runs (cache hits included)."""
    sb = _supabase()
    if sb is None:
        return
    try:
        sb.table("history").insert(
            {
                "user_id": user_id,
                "report_id": report.report_id,
                "sha256": report.sha256,
                "verdict": report.verdict.value,
                "confidence": report.confidence,
            }
        ).execute()
    except Exception as exc:
        logger.warning("Supabase record_history failed: %s", exc)


def get_history(user_id: str, limit: int = 50) -> list[dict]:
    sb = _supabase()
    if sb is None:
        return []
    try:
        return (
            sb.table("history")
            .select("report_id, sha256, verdict, confidence, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
            .data
        )
    except Exception as exc:
        logger.warning("Supabase get_history failed: %s", exc)
        return []
