# Lattice

Team work tracker: tickets, assignees, Kanban-style board, progress comments, and a **time clock** (clock in/out with Excel export). Built with [Next.js](https://nextjs.org/) and [Prisma](https://www.prisma.io/) with **PostgreSQL**.

## Local setup

1. Create a PostgreSQL database (e.g. [Neon](https://neon.tech) free tier, [Supabase](https://supabase.com), or Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lattice postgres:16`).

2. Configure and migrate:

```bash
npm install
cp .env.example .env
# Edit .env — set DATABASE_URL (see .env.example)

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
| `npm run demo` | Local demo: embedded Postgres + migrate + seed + `next dev` |
| `npm run vercel:host` | Print Vercel CLI checklist; full agent steps in `.cursor/skills/lattice-vercel-host/` |
| `npm run vercel:deploy` | Set `DATABASE_URL` on Vercel (Production) and run `vercel --prod` — needs `vercel login`, `vercel link`, and `DATABASE_URL` in env or a file (see script header) |

## Requirements

- Node.js 18+ (20+ recommended)
- PostgreSQL 14+ (or a hosted provider)

---

## Deploy to Vercel

### 1. Database (PostgreSQL)

Create a free database on [Neon](https://neon.tech) or [Supabase](https://supabase.com). You need **one** connection string: **`DATABASE_URL`**.

- **Neon / Railway / single URL:** Copy the `postgresql://…` URI (include `?sslmode=require` if the host requires SSL).
- **Supabase + Vercel:** Do **not** rely on the bare direct host `db.<project>.supabase.co:5432` alone (often fails from Vercel). In **Connect → ORM → Prisma**, copy the **Session pooler** URI (host like `….pooler.supabase.com`, port **5432**). Use that full string as **`DATABASE_URL`**.

### 2. Vercel project

Import the GitHub repo, framework **Next.js**, root `./`. Default **Build Command** is `npm run build` (migrations + seed + Next build).

### 3. Environment variable

**Settings → Environment Variables:**

| Name | Value |
|------|--------|
| `DATABASE_URL` | Full Postgres URI from step 1 |

Apply to **Production** (and **Preview** if needed). Remove obsolete **`DIRECT_URL`** if present (no longer used).

### 4. Deploy

Deploy or push to `main`. The build runs **`prisma migrate deploy`**, **`prisma db seed`**, then **`next build`**.

### 5. Empty assignees / time clock

If names still do not appear: wrong DB, paused Supabase, or seed did not run — set **`DATABASE_URL`** correctly, redeploy, or run `DATABASE_URL="…" npm run db:seed` locally against production.

---

### Troubleshooting

- **`P1001` on Supabase:** Use **Session pooler** `DATABASE_URL` from **Connect → ORM → Prisma**. Unpause the project if needed.
- **Migrate / build errors:** Verify `DATABASE_URL` and SSL query params for your host.
- **Empty team list (no red error):** Reseed or redeploy; confirm Vercel uses the same database you expect.
