import { NextResponse } from "next/server";
import { getActor } from "@/lib/actor";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = await ctx.params;

  const comments = await prisma.comment.findMany({
    where: { ticketId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getActor();
  const { id: ticketId } = await ctx.params;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const bodyText = typeof body?.body === "string" ? body.body.trim() : "";
  if (!bodyText) {
    return NextResponse.json({ error: "Comment text required" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      ticketId,
      authorId: user.id,
      body: bodyText,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ comment });
}
