import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sortAssignees } from "@/lib/team-order";

export async function GET() {
  const rows = await prisma.user.findMany({
    where: { email: { not: "team@team.local" } },
    select: { id: true, name: true, email: true, role: true },
  });

  const members = sortAssignees(rows);

  return NextResponse.json({ members });
}
