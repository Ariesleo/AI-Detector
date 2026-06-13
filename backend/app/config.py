from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """All config via env vars (.env). Every external service is optional —
    missing credentials degrade to local fallbacks, never crash:
    - no ANTHROPIC_API_KEY  → L4 skipped, rule-based verdict
    - no SUPABASE_*         → in-memory report cache, no history endpoint
    - no UPSTASH_*          → in-process rate limiting (resets on restart)
    """

    anthropic_api_key: str | None = None
    claude_vision_model: str = "claude-haiku-4-5-20251001"   # L4: cheap vision triage
    claude_verdict_model: str = "claude-sonnet-4-6"          # L5: reasoning + report

    # Gemini — free-tier alternative engine for L4/L5. Claude wins if both keys set.
    gemini_api_key: str | None = None
    gemini_vision_model: str = "gemini-2.5-flash"
    gemini_verdict_model: str = "gemini-2.5-flash"
    max_image_dimension: int = 1568    # downscale cap before Claude vision (token control)
    max_upload_bytes: int = 15 * 1024 * 1024

    # Supabase — persistent report cache, auth verification, user history
    supabase_url: str | None = None
    supabase_service_key: str | None = None   # service_role key, server-side only

    # Upstash Redis (REST) — cross-instance rate limiting
    upstash_redis_rest_url: str | None = None
    upstash_redis_rest_token: str | None = None

    # Abuse / cost controls (ARCHITECTURE.md §5)
    rate_limit_anon_daily: int = 5      # checks/day per IP, no account
    rate_limit_user_daily: int = 25     # checks/day per free workspace
    rate_limit_pro_daily: int = 10000   # "unlimited" with an abuse ceiling
    claude_daily_call_budget: int = 1000  # hard kill-switch: analyses/day that may spend Claude tokens

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
