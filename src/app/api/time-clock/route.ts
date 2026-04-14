import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_LIMIT = 500;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim() || undefined;
  const rawLimit = searchParams.get("limit");
  const limit = Math.min(
    Math.max(Number(rawLimit) || 100, 1),
    MAX_LIMIT,
  );

  const entries = await prisma.timeEntry.findMany({
    where: userId ? { userId } : {},
    orderBy: { clockIn: "desc" },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ entries });
}
