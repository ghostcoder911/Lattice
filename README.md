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


### Troubleshooting

- **`P1001: Can't reach database server` to `db.*.supabase.co:5432` on Vercel:** Use **Supabase pooler** URLs and set **`DIRECT_URL`** (session, port 5432) plus **`DATABASE_URL`** (transaction, port 6543 + `pgbouncer=true`). See step 4 above. Also confirm the Supabase project is **not paused** (dashboard banner).
- **Build fails on `prisma migrate deploy`:** Ensure **`DATABASE_URL` and `DIRECT_URL`** exist in Vercel for the environment you deploy to.
- **Runtime errors connecting to DB:** Ensure SSL if required (`?sslmode=require`).
- **Empty assignee list:** Redeploy so the build runs **`prisma db seed`**, or run `npm run db:seed` locally with production `DATABASE_URL` and `DIRECT_URL`. Confirm env vars match a working database.
