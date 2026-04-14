# Lattice

Team work tracker: tickets, assignees, Kanban-style board, progress comments, and a **time clock** (clock in/out with Excel export). Built with [Next.js](https://nextjs.org/) and [Prisma](https://www.prisma.io/) with **PostgreSQL**.

## Local setup

1. Create a PostgreSQL database (e.g. [Neon](https://neon.tech) free tier, [Supabase](https://supabase.com), or Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lattice postgres:16`).

2. Configure and migrate:

```bash
npm install
cp .env.example .env
# Edit .env — set DATABASE_URL to your Postgres connection string

npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | `prisma migrate deploy` + production Next.js build |
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
5. **Build Command:** leave default (`npm run build` or `next build`). This repo’s `build` script runs `prisma migrate deploy` then `next build`.
6. **Install Command:** `npm install` (default).

### 4. Add environment variables

In the Vercel project: **Settings** → **Environment Variables**:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Your Postgres URL (same as in Neon/Supabase; use **SSL** for cloud DBs). |

Apply to **Production** (and Preview if you want preview deployments to use a DB).

### 5. Deploy

Click **Deploy**. The first build will run migrations against your database, then build Next.js.

### 6. Seed data (once)

After the first successful deploy, load your team and sample tickets by running the seed **from your laptop** against the **production** database:

```bash
cd /path/to/Lattice
DATABASE_URL="postgresql://...your-production-url..." npm run db:seed
```

Or use Neon’s SQL editor / Prisma Studio with `DATABASE_URL` set — the app expects seeded users for assignees (see `prisma/seed.ts`).

### 7. Open the site

Vercel shows a URL like `https://your-project.vercel.app`. Custom domains: **Settings** → **Domains**.

---

### Troubleshooting

- **Build fails on `prisma migrate deploy`:** Check `DATABASE_URL` is set for the **Build** environment in Vercel (same as Production), and that the DB allows connections from the internet (Neon/Supabase do by default).
- **Runtime errors connecting to DB:** Ensure the connection string uses SSL if your provider requires it (`?sslmode=require`).
- **Empty assignee list:** Run `npm run db:seed` with production `DATABASE_URL` once.
