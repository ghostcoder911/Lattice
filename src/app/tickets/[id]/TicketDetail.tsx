"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PRIORITY_LABEL, STATUS_LABEL, TICKET_STATUSES } from "@/lib/constants";
import type { TicketStatus } from "@/lib/constants";

type UserBrief = { id: string; name: string; email: string };
type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: UserBrief;
};

type Ticket = {
  id: string;
  number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  creator: UserBrief;
  assignee: UserBrief | null;
  comments: Comment[];
};

type Member = UserBrief & { role: string };

type Props = {
  ticket: Ticket;
  members: Member[];
};

export function TicketDetail({ ticket: initial, members }: Props) {
  const router = useRouter();
  const [ticket, setTicket] = useState(initial);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Update failed");
    setTicket((t) => ({ ...t, ...j.ticket, comments: t.comments }));
    router.refresh();
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: comment }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setTicket((t) => ({
        ...t,
        comments: [...t.comments, j.comment],
      }));
      setComment("");
    } finally {
      setSaving(false);
    }
  }

  async function removeTicket() {
    if (!confirm("Delete this ticket?")) return;
    const res = await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
    if (res.ok) router.push("/board");
  }

  return (
    <div>
      <Link href="/board" className="text-sm text-emerald-500 hover:text-emerald-400">
        ← Back to board
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-emerald-500">ENG-{ticket.number}</p>
          <h1 className="mt-1 text-2xl font-semibold">{ticket.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Created by {ticket.creator.name}
            {ticket.assignee ? ` · Assigned to ${ticket.assignee.name}` : " · Unassigned"}
          </p>
        </div>
        <button
          type="button"
          onClick={removeTicket}
          className="rounded-lg border border-red-900/80 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/50"
        >
          Delete
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-zinc-500">Status</span>
          <select
            value={ticket.status}
            onChange={(e) => patch({ status: e.target.value as TicketStatus })}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          >
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-zinc-500">Priority</span>
          <select
            value={ticket.priority}
            onChange={(e) => patch({ priority: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          >
            {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-xs text-zinc-500">Assignee</span>
        <select
          value={ticket.assignee?.id ?? ""}
          onChange={(e) => patch({ assigneeId: e.target.value || null })}
          className="mt-1 w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-400">Description</h2>
        <textarea
          defaultValue={ticket.description}
          onBlur={(e) => {
            if (e.target.value !== ticket.description) patch({ description: e.target.value });
          }}
          rows={5}
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Progress updates</h2>
        <p className="text-sm text-zinc-500">Comments are visible to the whole team.</p>
        <ul className="mt-4 space-y-4">
          {ticket.comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{c.author.name}</span>
                <time dateTime={c.createdAt}>{new Date(c.createdAt).toLocaleString()}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">{c.body}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={addComment} className="mt-6 space-y-2">
          <label className="text-xs text-zinc-500">Add update</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="What did you ship, blockers, ETA…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving || !comment.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Posting…" : "Post update"}
          </button>
        </form>
      </section>
    </div>
  );
}
