import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PRIORITIES, TICKET_STATUSES, type Priority, type TicketStatus } from "@/lib/constants";

const statuses = [...TICKET_STATUSES];
const priorities = [...PRIORITIES];

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);

  const title = typeof body?.title === "string" ? body.title.trim() : undefined;
  const description = typeof body?.description === "string" ? body.description : undefined;
  const assigneeId = body?.assigneeId === null ? null : typeof body?.assigneeId === "string" ? body.assigneeId : undefined;
  const status = body?.status as TicketStatus | undefined;
  const priority = body?.priority as Priority | undefined;

  if (assigneeId) {
    const a = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!a) return NextResponse.json({ error: "Assignee not found" }, { status: 400 });
  }

  if (status && !statuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (priority && !priorities.includes(priority)) {
    return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(assigneeId !== undefined ? { assigneeId } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json({ ticket });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await prisma.ticket.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
