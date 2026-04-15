import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sortAssignees } from "@/lib/team-order";

export async function GET() {
  try {
    const rows = await prisma.user.findMany({
      where: { email: { not: "team@team.local" } },
      select: { id: true, name: true, email: true, role: true },
    });

    const members = sortAssignees(rows);

    return NextResponse.json({ members });
  } catch (err) {
    console.error("[api/team]", err);
    return NextResponse.json(
      {
        members: [] as { id: string; name: string; email: string; role: string }[],
        error: "DATABASE_UNAVAILABLE",
        message:
          "Could not load team members from the database. Check DATABASE_URL in Vercel (Settings → Environment Variables) and redeploy.",
      },
      { status: 503 },
    );
  }
}
