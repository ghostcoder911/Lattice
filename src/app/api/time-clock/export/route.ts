import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

function formatDurationMs(ms: number): string {
  if (ms <= 0) return "—";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0) return `${h}h ${min}m`;
  return `${min}m`;
}

export async function GET() {
  const rows = await prisma.timeEntry.findMany({
    orderBy: { clockIn: "asc" },
    include: { user: { select: { name: true, email: true } } },
  });

  const data = rows.map((r) => {
    const end = r.clockOut;
    const duration =
      end != null
        ? formatDurationMs(end.getTime() - r.clockIn.getTime())
        : "In progress";
    return {
      Name: r.user.name,
      Email: r.user.email,
      "Clock in": r.clockIn.toISOString(),
      "Clock out": r.clockOut ? r.clockOut.toISOString() : "",
      Duration: duration,
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = data.length
    ? XLSX.utils.json_to_sheet(data)
    : XLSX.utils.aoa_to_sheet([
        ["Name", "Email", "Clock in", "Clock out", "Duration"],
      ]);
  XLSX.utils.book_append_sheet(wb, ws, "Time clock");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const body = new Uint8Array(buf);

  const filename = `lattice-time-clock-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
