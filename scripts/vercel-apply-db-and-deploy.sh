#!/usr/bin/env bash
# Sets DATABASE_URL on the linked Vercel project (Production) and runs a production deploy.
# The agent cannot read your Supabase/Neon dashboard — you must supply the URL once.
#
# Usage:
#   export DATABASE_URL='postgresql://...'
#   npm run vercel:deploy
#
#   npm run vercel:deploy -- path/to/env-file
#   (file must define DATABASE_URL=... — use a gitignored file)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if command -v vercel >/dev/null 2>&1; then
  VERCEL=(vercel)
else
  VERCEL=(npx --yes vercel)
fi

URL=""
if [[ -n "${DATABASE_URL:-}" && "${DATABASE_URL}" != file:* ]]; then
  URL="$DATABASE_URL"
fi

if [[ -z "$URL" && -n "${1:-}" && -f "$1" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$1"
  set +a
  if [[ -n "${DATABASE_URL:-}" && "${DATABASE_URL}" != file:* ]]; then
    URL="$DATABASE_URL"
  fi
fi

if [[ -z "$URL" ]]; then
  cat <<'EOF'
No valid DATABASE_URL found.

1) Export your production Postgres URL (from Neon, or Supabase Connect → ORM → Prisma Session pooler):

   export DATABASE_URL='postgresql://...'
   npm run vercel:deploy

2) Or put it in a gitignored file and pass the path:

   echo 'DATABASE_URL=postgresql://...' > .env.production.local
   npm run vercel:deploy -- .env.production.local

Reject: sqlite (file:...) — use a hosted PostgreSQL URL.
EOF
  exit 1
fi

if ! "${VERCEL[@]}" whoami >/dev/null 2>&1; then
  echo "Run: ${VERCEL[*]} login"
  exit 1
fi

if [[ ! -f .vercel/project.json ]]; then
  echo "Run: ${VERCEL[*]} link   (select your Vercel team and the Lattice project)"
  exit 1
fi

echo "Uploading DATABASE_URL to Vercel (Production, sensitive) …"
"${VERCEL[@]}" env add DATABASE_URL production --value "$URL" --yes --force --sensitive

echo "Starting production deploy …"
"${VERCEL[@]}" --prod --yes

echo "Finished. Open the deployment URL from the output or the Vercel dashboard."
