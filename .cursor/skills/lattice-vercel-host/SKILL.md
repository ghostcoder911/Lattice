---
name: lattice-vercel-host
description: >-
  Hosts the Lattice Next.js app on Vercel with PostgreSQL (Prisma): CLI deploy,
  DATABASE_URL/DIRECT_URL for Supabase or Neon, migrations + seed on build.
  Use when the user asks to deploy Lattice, host on Vercel, set production DB,
  or automate Vercel/database setup for this repository.
---

# Lattice → Vercel + database (agent playbook)

## Limits (tell the user if relevant)

- **Cannot drive Firefox or the Vercel web UI.** Session cookies in a browser are not available to the agent. Use the **Vercel CLI** (`vercel`) instead; it uses the same account after `vercel login`.
- **Cannot create a Supabase/Neon project without API keys.** The user must create a free Postgres project in the provider dashboard once, or supply `NEON_API_KEY` / provider tokens for API automation.
- **Secrets never go in chat.** Read URLs from the user’s `.env.local`, `vercel env pull`, or ask them to paste into the terminal when running `vercel env add`, not into the IDE.

## Repository facts (Lattice)

- **Stack:** Next.js App Router, Prisma 5, PostgreSQL only (`prisma/schema.prisma` has `url` + `directUrl`).
- **Build:** `npm run build` = `prisma migrate deploy` → `prisma db seed` → `next build --turbopack`. Production needs **`DATABASE_URL`** and **`DIRECT_URL`** in Vercel for **Production** (and Preview if previews use a DB).
- **Supabase on Vercel:** Use **pooler** strings from **Connect → ORM → Prisma** — not raw `db.*.supabase.co:5432` alone (often causes P1001 on build). See `README.md` “Deploy to Vercel”.
- **Neon / single URL:** Set **`DATABASE_URL`** and **`DIRECT_URL` to the same connection string.**

## Agent workflow (execute in order)

### 1. Preflight

- Confirm cwd is the **Lattice repo root** (contains `package.json` with name `lattice`, `prisma/schema.prisma`).
- Run `command -v vercel` → if missing: `npm i -g vercel` (or `npx vercel` without global install).
- Run `vercel whoami`. If not logged in, run `vercel login` (opens browser once); do **not** claim you “used Firefox” for the agent — the user completes login in the opened window.

### 2. Git remote

- Ensure latest code is on **GitHub** (`origin`), branch **`main`**, if the user deploys from Git: `git status`, `git push origin main` when there are unpushed commits.

### 3. Link or deploy

- If the project is not linked: `vercel link` (select team, project name `lattice` or create new).
- Deploy: `vercel --prod` **or** rely on **Git integration** (push to `main` triggers build). Prefer documenting both; CLI is best for immediate feedback.

### 4. Database environment variables (critical)

- In Vercel **or** via CLI, ensure these exist for **Production**:

  | Variable       | Supabase | Neon |
  |----------------|----------|------|
  | `DATABASE_URL` | Transaction pooler **6543** + `?pgbouncer=true` (+ ssl) | Full `postgresql://…` |
  | `DIRECT_URL`   | Session pooler **5432** (same `*.pooler.supabase.com` host) | **Same as DATABASE_URL** |

- CLI example (user runs locally, pastes value at prompt — avoid echoing secrets in logs):

  ```bash
  vercel env add DATABASE_URL production
  vercel env add DIRECT_URL production
  ```

- After changing env: **Redeploy** (`vercel --prod` or “Redeploy” in dashboard).

### 5. Verify

- Build logs: `prisma migrate deploy` and `prisma db seed` succeed; `Seed OK` appears.
- App: `/board` and `/time-clock` show **assignee names** (seed creates users).

### 6. Troubleshooting (quick)

- **P1012 `Environment variable not found: DIRECT_URL`:** The Vercel project is missing **`DIRECT_URL`**. Add it next to `DATABASE_URL` (Neon: **same value** for both; Supabase: session pooler on **5432**). Redeploy.
- **P1001 to `db.*.supabase.co`:** Switch to **pooler** URLs + `DIRECT_URL`; see README.
- **Empty assignees:** Seed failed or old deploy — fix env, redeploy; build runs seed automatically (`package.json` `build` script).
- **`tsx` / seed errors:** `tsx` is a **dependency** in this repo for production seed.

## Optional script

From repo root: `bash scripts/vercel-host.sh` — checks CLI login and prints next steps (see script header).

## References

- Full deploy steps: [README.md](../../../README.md) (Deploy to Vercel).
- Supabase + Prisma: https://supabase.com/docs/guides/database/prisma
