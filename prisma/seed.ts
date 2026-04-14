import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

/** Shown in Assignee dropdowns (order preserved). */
const TEAM_MEMBERS: { email: string; name: string }[] = [
  { email: "neeraj@team.local", name: "Neeraj" },
  { email: "arjun.parameswaran@team.local", name: "Arjun Parameswaran" },
  { email: "ardra.babu@team.local", name: "Ardra Babu" },
  { email: "aisha.nazrin@team.local", name: "Aisha Nazrin" },
  { email: "praveena@team.local", name: "Praveena" },
  { email: "gopika@team.local", name: "Gopika" },
  { email: "aiswaria@team.local", name: "Aiswaria" },
  { email: "anumol@team.local", name: "Anumol" },
];

const LEGACY_EMAILS = ["lead@team.local", "alice@team.local", "bob@team.local"];

async function main() {
  const password = await bcrypt.hash("unused", 10);

  const team = await prisma.user.upsert({
    where: { email: "team@team.local" },
    update: {},
    create: {
      email: "team@team.local",
      name: "Team",
      passwordHash: password,
      role: "LEAD",
    },
  });

  const members: { id: string; email: string; name: string }[] = [];
  for (const m of TEAM_MEMBERS) {
    const u = await prisma.user.upsert({
      where: { email: m.email },
      update: { name: m.name },
      create: {
        email: m.email,
        name: m.name,
        passwordHash: password,
        role: "ENGINEER",
      },
    });
    members.push(u);
  }

  // Point legacy demo users' tickets/comments at Team, then remove demo rows
  const legacy = await prisma.user.findMany({
    where: { email: { in: LEGACY_EMAILS } },
    select: { id: true },
  });
  const legacyIds = legacy.map((u) => u.id);
  if (legacyIds.length) {
    await prisma.ticket.updateMany({
      where: { creatorId: { in: legacyIds } },
      data: { creatorId: team.id },
    });
    await prisma.ticket.updateMany({
      where: { assigneeId: { in: legacyIds } },
      data: { assigneeId: null },
    });
    await prisma.comment.updateMany({
      where: { authorId: { in: legacyIds } },
      data: { authorId: team.id },
    });
    await prisma.user.deleteMany({ where: { id: { in: legacyIds } } });
  }

  const count = await prisma.ticket.count();
  if (count === 0) {
    const neeraj = members[0];
    const arjun = members[1];

    await prisma.ticket.createMany({
      data: [
        {
          number: 1,
          title: "Set up CI pipeline",
          description: "GitHub Actions for test + lint on each PR.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          creatorId: team.id,
          assigneeId: neeraj.id,
        },
        {
          number: 2,
          title: "API rate limiting",
          description: "Add token bucket middleware on public routes.",
          status: "TODO",
          priority: "MEDIUM",
          creatorId: team.id,
          assigneeId: arjun.id,
        },
        {
          number: 3,
          title: "Backlog: dark mode polish",
          description: "Contrast fixes in settings screens.",
          status: "BACKLOG",
          priority: "LOW",
          creatorId: team.id,
          assigneeId: null,
        },
      ],
    });

    const t1 = await prisma.ticket.findFirst({ where: { number: 1 } });
    if (t1) {
      await prisma.comment.create({
        data: {
          ticketId: t1.id,
          authorId: neeraj.id,
          body: "Started wiring the workflow file; first run green on my branch.",
        },
      });
    }
  }

  console.log(
    "Seed OK. Assignee list: " + TEAM_MEMBERS.map((m) => m.name).join(", "),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
