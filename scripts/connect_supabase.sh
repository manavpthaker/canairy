#!/usr/bin/env bash
# Connect Canairy's Vercel project to Supabase and load a year of history.
# Prompts for the database password; it is never echoed or written to disk.
set -euo pipefail
cd "$(dirname "$0")/.."

POOLER_USER="postgres.ldctdsklecnipusjcbwj"
POOLER_HOST="aws-0-us-east-2.pooler.supabase.com:6543"

read -rsp "Supabase database password: " PW; echo
ENCODED_PW=$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$PW")
URL="postgresql://${POOLER_USER}:${ENCODED_PW}@${POOLER_HOST}/postgres?sslmode=require"

echo "Checking the connection..."
DATABASE_URL="$URL" .venv/bin/python -c 'import sys; sys.path.insert(0, "server"); from api import store; store.engine(); print("connected")'

for env in production preview; do
  printf '%s' "$URL" | npx --yes vercel@latest env add DATABASE_URL "$env" --force --sensitive >/dev/null
  echo "DATABASE_URL set for $env"
done

echo "Loading readings and a year of history into Supabase..."
set -a; source .env; set +a
cd server
DATABASE_URL="$URL" ../.venv/bin/python -m api.collect | tail -1
DATABASE_URL="$URL" ../.venv/bin/python -m api.collect --backfill 365 | tail -1
echo "Done. Tell Claude to continue."
