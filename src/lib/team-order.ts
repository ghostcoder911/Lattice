/** Assignee dropdown order (matches seed). */
export const ASSIGNEE_EMAIL_ORDER = [
  "neeraj@team.local",
  "arjun.parameswaran@team.local",
  "ardra.babu@team.local",
  "aisha.nazrin@team.local",
  "praveena@team.local",
  "gopika@team.local",
  "aiswaria@team.local",
  "anumol@team.local",
] as const;

const ACTOR_EMAIL = "team@team.local";

export function sortAssignees<T extends { email: string }>(members: T[]): T[] {
  const filtered = members.filter((m) => m.email !== ACTOR_EMAIL);
  const rank = new Map<string, number>(
    ASSIGNEE_EMAIL_ORDER.map((e, i) => [e, i] as [string, number]),
  );
  return [...filtered].sort((a, b) => {
    const ra = rank.get(a.email) ?? 999;
    const rb = rank.get(b.email) ?? 999;
    if (ra !== rb) return ra - rb;
    return a.email.localeCompare(b.email);
  });
}
