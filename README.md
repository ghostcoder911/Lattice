# Lattice

Team work tracker: tickets, assignees, Kanban-style board, and progress comments. Built with [Next.js](https://nextjs.org/) and [Prisma](https://www.prisma.io/) (SQLite).

## Setup

```bash
npm install
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Development server       |
| `npm run build`| Production build         |
| `npm run start`| Run production server    |
| `npm run db:push` | Apply Prisma schema to DB |
| `npm run db:seed` | Seed team members & sample tickets |

## Requirements

- Node.js 18+ (20+ recommended for some tooling)
