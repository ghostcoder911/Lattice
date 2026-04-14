# Lattice

Team work tracker: tickets, assignees, Kanban-style board, progress comments, and a **time clock** (clock in/out with Excel export). Built with [Next.js](https://nextjs.org/) and [Prisma](https://www.prisma.io/) with **PostgreSQL**.

## Local setup

1. Create a PostgreSQL database (e.g. [Neon](https://neon.tech) free tier, [Supabase](https://supabase.com), or Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lattice postgres:16`).

2. Configure and migrate:

```bash
npm install
cp .env.example .env
# Edit .env — set DATABASE_URL and DIRECT_URL (same value for a direct/local DB; see .env.example)

npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | `prisma migrate deploy` + `prisma db seed` + production Next.js build |
| `npm run start` | Run production server |
| `npm run db:seed` | Seed team members and sample tickets |

## Requirements

- Node.js 18+ (20+ recommended)
- PostgreSQL 14+ (or a hosted provider)

---

## Deploy to Vercel (step by step)

### 1. Put the code on GitHub

Push this repo to GitHub if it is not already there (`git push origin main`).

### 2. Create a PostgreSQL database (required)

Vercel cannot use SQLite for this app. Use a hosted Postgres:

- **[Neon](https://neon.tech)** (recommended, free tier): create a project → copy the connection string (include `?sslmode=require` if offered).
- Alternatives: **[Supabase](https://supabase.com)** → Project Settings → Database → URI, or **[Vercel Postgres](https://vercel.com/storage/postgres)** from the Vercel dashboard.

### 3. Import the project in Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub login is fine).
2. **Add New…** → **Project** → **Import** your `Lattice` (or repo name) repository.
3. **Framework Preset:** Next.js (auto-detected).
4. **Root Directory:** leave default if the Next app is at the repo root.
5. **Build Command:** leave default (`npm run build` or `next build`). This repo’s `build` script runs `prisma migrate deploy`, then **`prisma db seed`** (team + optional sample tickets), then `next build`.
6. **Install Command:** `npm install` (default).

### 4. Add environment variables

In the Vercel project: **Settings** → **Environment Variables**:

**Neon, Railway, or any single “direct” Postgres URL**

| Name | Value |
|------|--------|
| `DATABASE_URL` | Full `postgresql://...` URL (include `?sslmode=require` if the host requires SSL). |
| `DIRECT_URL` | **Same string as `DATABASE_URL`.** (Prisma requires this field in this repo.) |

**Supabase (recommended on Vercel — avoids “Can’t reach database” / P1001 during build)**

Vercel’s build servers often cannot open the **direct** host `db.<project>.supabase.co:5432`. Use the **pooler** strings from **Connect → ORM → Prisma** (see [Supabase + Prisma](https://supabase.com/docs/guides/database/prisma)):

| Name | Value |
|------|--------|
| `DATABASE_URL` | **Transaction pooler** URI (port **6543**), and append **`?pgbouncer=true`** (and `&sslmode=require` if not already there). |
| `DIRECT_URL` | **Session pooler** URI (port **5432**) on the **same** `*.pooler.supabase.com` host — *not* `db.*.supabase.co`. |

Use your real database password in both URLs (no `[YOUR-PASSWORD]` placeholder).

Apply both variables to **Production** (and **Preview** if you use preview deployments).

### 5. Deploy

Click **Deploy**. Each production build runs **migrations**, then **seeds** the team list (and sample tickets only if the board is empty), then builds Next.js. You do **not** need to run `npm run db:seed` manually on Vercel.

### 6. Optional: seed again from your laptop

If you ever need to re-run the seed (e.g. after resetting the DB), use the same `DATABASE_URL` and `DIRECT_URL` as in Vercel:

```bash
cd /path/to/Lattice
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."
npm run db:seed
```

### 7. Open the site

Vercel shows a URL like `https://your-project.vercel.app`. Custom domains: **Settings** → **Domains**.

---

### Troubleshooting

- **`P1001: Can't reach database server` to `db.*.supabase.co:5432` on Vercel:** Use **Supabase pooler** URLs and set **`DIRECT_URL`** (session, port 5432) plus **`DATABASE_URL`** (transaction, port 6543 + `pgbouncer=true`). See step 4 above. Also confirm the Supabase project is **not paused** (dashboard banner).
- **Build fails on `prisma migrate deploy`:** Ensure **`DATABASE_URL` and `DIRECT_URL`** exist in Vercel for the environment you deploy to.
- **Runtime errors connecting to DB:** Ensure SSL if required (`?sslmode=require`).
- **Empty assignee list:** Redeploy so the build runs **`prisma db seed`**, or run `npm run db:seed` locally with production `DATABASE_URL` and `DIRECT_URL`. Confirm env vars match a working database.
