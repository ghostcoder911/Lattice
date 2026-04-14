import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sortAssignees } from "@/lib/team-order";
import { AppHeader } from "@/components/AppHeader";
import { TicketDetail } from "./TicketDetail";

type Props = { params: Promise<{ id: string }> };

export default async function TicketPage(props: Props) {
  const { id } = await props.params;
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

  if (!ticket) notFound();

  const memberRows = await prisma.user.findMany({
    where: { email: { not: "team@team.local" } },
    select: { id: true, name: true, email: true, role: true },
  });
  const members = sortAssignees(memberRows);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppHeader />
      <main className="mx-auto max-w-3xl p-4">
        <TicketDetail ticket={JSON.parse(JSON.stringify(ticket))} members={members} />
      </main>
    </div>
  );
}
