import { prisma } from "./prisma";

export async function nextTicketNumber(): Promise<number> {
  const agg = await prisma.ticket.aggregate({ _max: { number: true } });
  return (agg._max.number ?? 0) + 1;
}

export function ticketLabel(number: number) {
  return `ENG-${number}`;
}
