#!/usr/bin/env bash
# Lattice — Vercel hosting helper (does not open Firefox; uses Vercel CLI).
# Usage: bash scripts/vercel-host.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== Lattice / Vercel host helper =="
echo "Repo: $ROOT"
echo ""

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI not found. Install with:"
  echo "  npm install -g vercel"
  echo "Or use: npx vercel --version"
  exit 1
fi

echo "Vercel CLI: $(vercel --version)"
echo ""

if ! vercel whoami >/dev/null 2>&1; then
  echo "Not logged in. Run:"
  echo "  vercel login"
  echo "Then re-run this script."
  exit 1
fi

echo "Logged in as: $(vercel whoami)"
echo ""
echo "Next steps (run from this repo):"
echo "  1. Link project (once):  vercel link"
echo "  2. Add secrets (Production):"
echo "       vercel env add DATABASE_URL production"
echo "       vercel env add DIRECT_URL production"
echo "     Use Supabase pooler URLs from Connect → ORM → Prisma, or Neon (same URL for both)."
echo "  3. Deploy:                vercel --prod"
echo "     Or push to GitHub main if the project is imported in Vercel."
echo ""
echo "See README.md (Deploy to Vercel) and .cursor/skills/lattice-vercel-host/SKILL.md"
echo "for the full checklist."
