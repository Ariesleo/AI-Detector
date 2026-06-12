"""Supabase auth: resolve an optional Bearer token to a user id.

The mobile app signs users in with supabase-js and sends the access token as
`Authorization: Bearer <jwt>`. We verify it against Supabase's auth server
(network call — no JWT secret to manage, works with any signing config).

Anonymous requests are first-class: no header → None → anon rate limits,
no history. Invalid tokens also resolve to None on /v1/analyze (degrade to
anon) but 401 on /v1/history where identity is the whole point.
"""
from __future__ import annotations

import logging

from . import store

logger = logging.getLogger(__name__)


def resolve_user_id(authorization: str | None) -> str | None:
    """Bearer token → Supabase user id, or None (anonymous/invalid/no Supabase)."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization[7:].strip()
    if not token:
        return None
    sb = store._supabase()
    if sb is None:
        return None
    try:
        user_resp = sb.auth.get_user(token)
        return user_resp.user.id if user_resp and user_resp.user else None
    except Exception as exc:
        logger.info("Token verification failed: %s", exc)
        return None
