#!/usr/bin/env bash
# Lattice — Vercel hosting helper (does not open Firefox; uses Vercel CLI).
# Usage: bash scripts/vercel-host.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== Lattice / Vercel host helper =="
echo "Repo: $ROOT"
echo ""

if command -v vercel >/dev/null 2>&1; then
  VERCEL=(vercel)
else
  VERCEL=(npx --yes vercel)
  echo "Using: npx vercel (install globally with: npm install -g vercel)"
fi

echo "Vercel CLI: $("${VERCEL[@]}" --version)"
echo ""

if ! "${VERCEL[@]}" whoami >/dev/null 2>&1; then
  echo "Not logged in in this terminal. Run (opens browser once):"
  echo "  ${VERCEL[*]} login"
  echo "Then re-run: npm run vercel:host"
  exit 1
fi

echo "Logged in as: $("${VERCEL[@]}" whoami)"
echo ""
echo "Next steps (run from this repo):"
echo "  1. Link project (once):  ${VERCEL[*]} link"
echo "  2. Add secrets (Production):"
echo "       ${VERCEL[*]} env add DATABASE_URL production"
echo "       ${VERCEL[*]} env add DIRECT_URL production"
echo "     Use Supabase pooler URLs from Connect → ORM → Prisma, or Neon (same URL for both)."
echo "  3. Deploy:                ${VERCEL[*]} --prod"
echo "     Or push to GitHub main if the project is imported in Vercel."
echo ""
echo "See README.md (Deploy to Vercel) and .cursor/skills/lattice-vercel-host/SKILL.md"
echo "for the full checklist."
