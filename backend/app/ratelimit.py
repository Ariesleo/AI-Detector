"""Rate limiting + daily Claude budget kill-switch (ARCHITECTURE.md §5).

Counters live in Upstash Redis (REST API — plain HTTPS, works from Lambda)
when UPSTASH_REDIS_REST_URL/TOKEN are set; otherwise an in-process dict that
resets on restart — fine for dev, useless across instances, hence Upstash.

Keys are day-scoped (`rl:{who}:{YYYYMMDD}`) with a 2-day TTL so they
self-clean. Upstash failures FAIL OPEN: a broken limiter must never block
analysis (the budget switch then also fails open — bounded by the upstream
Anthropic spend limit you set in the Console).
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

import httpx

from .config import settings

logger = logging.getLogger(__name__)

_DAY_TTL_SECONDS = 2 * 24 * 3600

# in-memory fallback: key -> (count, expires_at_epoch)
_local_counts: dict[str, tuple[int, float]] = {}


def upstash_enabled() -> bool:
    return bool(settings.upstash_redis_rest_url and settings.upstash_redis_rest_token)


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d")


def _incr(key: str) -> int | None:
    """Increment day-scoped counter, return new value. None = backend failure."""
    if upstash_enabled():
        try:
            resp = httpx.post(
                f"{settings.upstash_redis_rest_url.rstrip('/')}/pipeline",
                headers={"Authorization": f"Bearer {settings.upstash_redis_rest_token}"},
                json=[["INCR", key], ["EXPIRE", key, _DAY_TTL_SECONDS, "NX"]],
                timeout=3.0,
            )
            resp.raise_for_status()
            return int(resp.json()[0]["result"])
        except Exception as exc:
            logger.warning("Upstash INCR failed (failing open): %s", exc)
            return None
    # local fallback
    now = time.time()
    count, expires = _local_counts.get(key, (0, now + _DAY_TTL_SECONDS))
    if now > expires:
        count, expires = 0, now + _DAY_TTL_SECONDS
    count += 1
    _local_counts[key] = (count, expires)
    return count


def _peek(key: str) -> int:
    """Read counter without incrementing. 0 on failure (fail open)."""
    if upstash_enabled():
        try:
            resp = httpx.get(
                f"{settings.upstash_redis_rest_url.rstrip('/')}/get/{key}",
                headers={"Authorization": f"Bearer {settings.upstash_redis_rest_token}"},
                timeout=3.0,
            )
            resp.raise_for_status()
            result = resp.json().get("result")
            return int(result) if result is not None else 0
        except Exception as exc:
            logger.warning("Upstash GET failed (failing open): %s", exc)
            return 0
    count, expires = _local_counts.get(key, (0, 0))
    return count if time.time() <= expires else 0


def check_quota(ip: str, user_id: str | None) -> tuple[bool, int]:
    """Count this request against the caller's daily quota.

    Returns (allowed, remaining). Authenticated users get the higher cap
    keyed by user id; anonymous callers are keyed by IP.
    """
    if user_id:
        key, limit = f"rl:u:{user_id}:{_today()}", settings.rate_limit_user_daily
    else:
        key, limit = f"rl:ip:{ip}:{_today()}", settings.rate_limit_anon_daily
    count = _incr(key)
    if count is None:  # backend down — fail open
        return True, limit
    return count <= limit, max(0, limit - count)


def claude_budget_ok() -> bool:
    """True while today's Claude-spending analyses are under the kill-switch cap."""
    return _peek(f"budget:claude:{_today()}") < settings.claude_daily_call_budget


def count_claude_use() -> None:
    """Call once per analysis that actually hit the Claude API."""
    _incr(f"budget:claude:{_today()}")
