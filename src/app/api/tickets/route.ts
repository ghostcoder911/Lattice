import { NextResponse } from "next/server";
import { getActor } from "@/lib/actor";
import { prisma } from "@/lib/prisma";
import { nextTicketNumber } from "@/lib/tickets";
import { PRIORITIES, TICKET_STATUSES, type Priority, type TicketStatus } from "@/lib/constants";

const statuses = [...TICKET_STATUSES];
const priorities = [...PRIORITIES];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as TicketStatus | null;
    const assigneeId = searchParams.get("assigneeId");

    const tickets = await prisma.ticket.findMany({
      where: {
        ...(status && statuses.includes(status) ? { status } : {}),
        ...(assigneeId ? { assigneeId } : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error("[api/tickets GET]", err);
    return NextResponse.json(
      {
        tickets: [],
        error: "DATABASE_UNAVAILABLE",
        message:
          "Could not load tickets. Check DATABASE_URL in Vercel and redeploy.",
      },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  const user = await getActor();

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description : "";
  const assigneeId = typeof body?.assigneeId === "string" ? body.assigneeId : null;
  const status = (body?.status as TicketStatus) ?? "BACKLOG";
  const priority = (body?.priority as Priority) ?? "MEDIUM";

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!statuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (!priorities.includes(priority)) {
    return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
  }

  if (assigneeId) {
    const a = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!a) return NextResponse.json({ error: "Assignee not found" }, { status: 400 });
  }

  const number = await nextTicketNumber();
  const ticket = await prisma.ticket.create({
    data: {
      number,
      title,
      description,
      status,
      priority,
      creatorId: user.id,
      assigneeId: assigneeId || undefined,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ ticket });
}
