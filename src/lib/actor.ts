import { prisma } from "./prisma";

/** Shared identity for unauthenticated team access (attribution in DB). */
const ACTOR_EMAIL = "team@team.local";

export type Actor = { id: string; email: string; name: string; role: string };

export async function getActor(): Promise<Actor> {
  const u = await prisma.user.findUnique({
    where: { email: ACTOR_EMAIL },
    select: { id: true, email: true, name: true, role: true },
  });
  if (u) return u;
  const first = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!first) {
    throw new Error("Database has no users. Run: npm run db:seed");
  }
  return first;
}
