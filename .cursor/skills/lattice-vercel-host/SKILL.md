---
name: lattice-vercel-host
description: >-
  Hosts the Lattice Next.js app on Vercel with PostgreSQL (Prisma): CLI deploy,
  DATABASE_URL (Session pooler on Supabase), migrations + seed on build.
  Use when the user asks to deploy Lattice, host on Vercel, fix empty team list,
  or automate Vercel/database setup for this repository.
---

# Lattice → Vercel + database (agent playbook)

## Limits (tell the user if relevant)

- **Cannot drive Firefox or the Vercel web UI.** Use the **Vercel CLI** (`vercel`) after `vercel login`.
- **Cannot create a Supabase/Neon project without API keys.** The user creates the DB in the provider dashboard once.
- **Secrets never go in chat.**

## Repository facts (Lattice)

- **Stack:** Next.js App Router, Prisma 5, PostgreSQL — **`DATABASE_URL` only** in `prisma/schema.prisma`.
- **Build:** `npm run build` = `prisma migrate deploy` → `prisma db seed` → `next build --turbopack`.
- **Supabase + Vercel:** Set **`DATABASE_URL`** to the **Session pooler** URI from **Connect → ORM → Prisma** (port **5432**, `*.pooler.supabase.com`). Avoid bare `db.*.supabase.co:5432` (often P1001 from Vercel).
- **Neon:** Use the single `postgresql://…` connection string as **`DATABASE_URL`**.

## Agent workflow (execute in order)

### 1. Preflight

- Cwd = Lattice repo root (`package.json` name `lattice`).
- `vercel whoami` or `npx vercel whoami`; `vercel login` if needed.

### 2. Git

- Push `main` to GitHub if there are local commits.

### 3. Deploy

- `vercel link` (once) / `vercel --prod` **or** rely on Git → Vercel import.

### 4. Environment variable + redeploy (automated)

If the user provides **`DATABASE_URL`** (export or gitignored file), run from repo root:

```bash
export DATABASE_URL='postgresql://…'
npm run vercel:deploy
```

Or: `npm run vercel:deploy -- .env.production.local` where that file contains `DATABASE_URL=…`.

This script calls **`vercel env add DATABASE_URL production --value … --sensitive`** then **`vercel --prod`**. Requires **`vercel login`** and **`vercel link`** to the correct project first.

Manual alternative: Vercel **Settings → Environment Variables** → **`DATABASE_URL`** → **Redeploy**.

### 5. Verify

- Build: migrate + **Seed OK** in logs.
- UI: `/board` and `/time-clock` show names; if not, API returns 503 with a message (check runtime `DATABASE_URL`).

### 6. Troubleshooting

- **P1001 / empty team:** Wrong or direct-only Supabase host — use **Session pooler** `DATABASE_URL`.
- **Empty list, no red error:** DB empty — redeploy (seed on build) or `DATABASE_URL=… npm run db:seed` locally against production.

## Optional script

`npm run vercel:host` — CLI checklist.

## References

- Repo **README.md** (Deploy to Vercel).
- https://supabase.com/docs/guides/database/prisma
