"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { TicketStatus } from "@/lib/constants";
import { PRIORITY_LABEL, STATUS_LABEL, TICKET_STATUSES } from "@/lib/constants";

type UserBrief = { id: string; name: string; email: string };
type Ticket = {
  id: string;
  number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  creator: UserBrief;
  assignee: UserBrief | null;
  _count: { comments: number };
};

export function BoardView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [members, setMembers] = useState<(UserBrief & { role: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [teamEmptyHint, setTeamEmptyHint] = useState(false);

  const load = useCallback(async () => {
    setFetchError(null);
    setTeamEmptyHint(false);
    const [tRes, mRes] = await Promise.all([fetch("/api/tickets"), fetch("/api/team")]);
    const tJson = await tRes.json().catch(() => ({}));
    const mJson = await mRes.json().catch(() => ({}));

    const errs: string[] = [];
    if (tRes.ok) setTickets(tJson.tickets ?? []);
    else errs.push(typeof tJson.message === "string" ? tJson.message : `Tickets (${tRes.status})`);

    if (mRes.ok) {
      const list = mJson.members ?? [];
      setMembers(list);
      if (list.length === 0) setTeamEmptyHint(true);
    } else {
      setMembers([]);
      errs.push(typeof mJson.message === "string" ? mJson.message : `Team (${mRes.status})`);
    }

    setFetchError(errs.length ? errs.join(" ") : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byStatus = TICKET_STATUSES.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    items: tickets.filter((t) => t.status === status),
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Work board</h1>
          <p className="text-sm text-zinc-500">Open a ticket to change status, priority, or post updates.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          New ticket
        </button>
      </div>

      {fetchError ? (
        <div className="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {fetchError}
        </div>
      ) : null}
      {teamEmptyHint && !fetchError ? (
        <div className="mb-4 rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          No team members loaded. In Vercel, set <strong className="font-mono">DATABASE_URL</strong> to your
          Postgres connection string (Supabase: use the <strong>Session pooler</strong> URI from Connect → ORM →
          Prisma), then <strong>Redeploy</strong>. The production build runs <code className="text-xs">prisma db seed</code> to create names.
        </div>
      ) : null}

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {byStatus.map((col) => (
            <div
              key={col.status}
              className="flex w-72 shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/50"
            >
              <div className="border-b border-zinc-800 px-3 py-2">
                <span className="text-sm font-medium text-zinc-200">{col.label}</span>
                <span className="ml-2 text-xs text-zinc-500">{col.items.length}</span>
              </div>
              <div className="flex flex-col gap-2 p-2">
                {col.items.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="block rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 shadow-sm transition hover:border-zinc-600"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs text-emerald-500/90">ENG-{t.number}</span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                        {PRIORITY_LABEL[t.priority as keyof typeof PRIORITY_LABEL] ?? t.priority}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-zinc-200">{t.title}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {t.assignee ? t.assignee.name : "Unassigned"} · {t._count.comments} updates
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <NewTicketModal
          members={members}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function NewTicketModal({
  members,
  onClose,
  onCreated,
}: {
  members: (UserBrief & { role: string })[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState<TicketStatus>("BACKLOG");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
          status,
          assigneeId: assigneeId || null,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Failed");
        return;
      }
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-100">New ticket</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-zinc-400">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400">Column</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
