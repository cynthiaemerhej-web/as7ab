#!/usr/bin/env bash
# Runs the database tests (tests/db) against a throwaway local Postgres 16
# cluster, applying the Supabase shim, the real migrations and the seed.
#
#   bash scripts/db-test.sh                      # local cluster in /tmp/as7ab-pg
#   bash scripts/db-test.sh --external "$URL"    # existing empty database (CI)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MIGRATIONS=(tests/db/shim.sql supabase/migrations/0001_schema.sql supabase/migrations/0002_rls.sql supabase/seed.sql)

if [[ "${1:-}" == "--external" ]]; then
  export DATABASE_URL="$2"
  for f in "${MIGRATIONS[@]}"; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$f"; done
  exec npx vitest run -c vitest.db.config.ts
fi

PGBIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
if [[ -z "$PGBIN" ]]; then PGBIN="$(dirname "$(command -v pg_ctl)")"; fi
DIR=/tmp/as7ab-pg
PORT=54329
DB=as7ab_test

run_pg() {
  if [[ "$(id -u)" == "0" ]]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi
}

cleanup() { run_pg "$PGBIN/pg_ctl -D $DIR/data stop -m fast" >/dev/null 2>&1 || true; }
trap cleanup EXIT

rm -rf "$DIR"; mkdir -p "$DIR"
if [[ "$(id -u)" == "0" ]]; then chown postgres "$DIR"; fi
run_pg "$PGBIN/initdb -D $DIR/data -A trust -U postgres" >/dev/null
run_pg "$PGBIN/pg_ctl -D $DIR/data -o \"-p $PORT -k $DIR -c listen_addresses=''\" -l $DIR/log start" >/dev/null
for i in $(seq 1 20); do
  if "$PGBIN/pg_isready" -h "$DIR" -p "$PORT" -U postgres >/dev/null 2>&1; then break; fi
  sleep 0.5
done
"$PGBIN/createdb" -h "$DIR" -p "$PORT" -U postgres "$DB"
for f in "${MIGRATIONS[@]}"; do
  "$PGBIN/psql" -h "$DIR" -p "$PORT" -U postgres -d "$DB" -v ON_ERROR_STOP=1 -q -f "$f"
done

export PGHOST="$DIR" PGPORT="$PORT" PGUSER=postgres PGDATABASE="$DB"
npx vitest run -c vitest.db.config.ts "${@}"
