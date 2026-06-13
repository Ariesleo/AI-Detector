#!/usr/bin/env bash
# Veritas migration runner — applies backend/migrations/*.sql in filename
# order, each exactly once, tracked in public.schema_migrations.
#
# Usage (from anywhere):
#   backend/scripts/migrate.sh              apply pending migrations
#   backend/scripts/migrate.sh --status     show applied vs pending
#   backend/scripts/migrate.sh --baseline   mark ALL as applied without running
#                                           (use once if you ran files by hand)
#
# Connection: set SUPABASE_DB_URL in backend/.env (or export it) — the
# "Session pooler" URI from Supabase Dashboard → Connect, with your DB password.
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$BACKEND_DIR/migrations"

# --- locate psql (PATH, then Homebrew libpq keg) ---------------------------
PSQL="$(command -v psql || true)"
if [[ -z "$PSQL" ]]; then
  for p in /opt/homebrew/opt/libpq/bin/psql /usr/local/opt/libpq/bin/psql; do
    [[ -x "$p" ]] && PSQL="$p" && break
  done
fi
if [[ -z "$PSQL" ]]; then
  echo "error: psql not found — install with: brew install libpq" >&2
  exit 1
fi

# --- resolve connection string ---------------------------------------------
if [[ -z "${SUPABASE_DB_URL:-}" && -f "$BACKEND_DIR/.env" ]]; then
  SUPABASE_DB_URL="$( (grep -E '^SUPABASE_DB_URL=' "$BACKEND_DIR/.env" || true) | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')"
fi
if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  cat >&2 <<'EOF'
error: SUPABASE_DB_URL is not set.

Add it to backend/.env (gitignored):
  SUPABASE_DB_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-X-region.pooler.supabase.com:5432/postgres

Get the URI from Supabase Dashboard → Connect → "Session pooler",
and substitute your database password.
EOF
  exit 1
fi

sql() { "$PSQL" "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -qAt -c "$1"; }

# --- tracking table ----------------------------------------------------------
sql "set client_min_messages = warning;
     create table if not exists public.schema_migrations (
       filename   text primary key,
       applied_at timestamptz not null default now()
     )" > /dev/null

applied="$(sql 'select filename from public.schema_migrations order by filename')"
is_applied() { grep -qx -- "$1" <<<"$applied"; }

shopt -s nullglob
files=("$MIGRATIONS_DIR"/*.sql)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "no migration files in $MIGRATIONS_DIR"
  exit 0
fi

mode="${1:-apply}"
case "$mode" in
  --status|status)
    for f in "${files[@]}"; do
      base="$(basename "$f")"
      if is_applied "$base"; then echo "applied   $base"; else echo "pending   $base"; fi
    done
    ;;

  --baseline|baseline)
    for f in "${files[@]}"; do
      base="$(basename "$f")"
      if is_applied "$base"; then
        echo "already   $base"
      else
        sql "insert into public.schema_migrations (filename) values ('$base')" > /dev/null
        echo "baselined $base (marked applied, not executed)"
      fi
    done
    ;;

  apply|--apply)
    count=0
    for f in "${files[@]}"; do
      base="$(basename "$f")"
      is_applied "$base" && continue
      echo "→ applying $base"
      "$PSQL" "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -f "$f"
      sql "insert into public.schema_migrations (filename) values ('$base')" > /dev/null
      count=$((count + 1))
    done
    if [[ $count -eq 0 ]]; then
      echo "Nothing to apply — database is up to date."
    else
      echo "Applied $count migration(s)."
    fi
    ;;

  *)
    echo "usage: $0 [--status | --baseline | apply]" >&2
    exit 64
    ;;
esac
