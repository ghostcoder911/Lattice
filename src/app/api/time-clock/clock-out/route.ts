import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, email: { not: "team@team.local" } },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const open = await prisma.timeEntry.findFirst({
    where: { userId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });

  if (!open) {
    return NextResponse.json(
      { error: "Not clocked in. Clock in first." },
      { status: 409 },
    );
  }

  const entry = await prisma.timeEntry.update({
    where: { id: open.id },
    data: { clockOut: new Date() },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ entry });
}
