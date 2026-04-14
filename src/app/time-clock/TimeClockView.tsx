"use client";

import { useCallback, useEffect, useState } from "react";

type Member = { id: string; name: string; email: string; role: string };

type Entry = {
  id: string;
  userId: string;
  clockIn: string;
  clockOut: string | null;
  user: { name: string; email: string };
};

function formatLocal(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function TimeClockView() {
  const [members, setMembers] = useState<Member[]>([]);
  const [userId, setUserId] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [clockedIn, setClockedIn] = useState(false);
  const [openSinceIso, setOpenSinceIso] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const loadTeam = useCallback(async () => {
    const res = await fetch("/api/team");
    const data = await res.json();
    setMembers(data.members ?? []);
  }, []);

  const loadEntries = useCallback(async () => {
    const q = userId
      ? `?userId=${encodeURIComponent(userId)}&limit=200`
      : "?limit=200";
    const res = await fetch(`/api/time-clock${q}`);
    const data = await res.json();
    setEntries(data.entries ?? []);
  }, [userId]);

  const loadStatus = useCallback(async () => {
    if (!userId) {
      setClockedIn(false);
      setOpenSinceIso(null);
      return;
    }
    const res = await fetch(
      `/api/time-clock/status?userId=${encodeURIComponent(userId)}`,
    );
    const data = await res.json();
    setClockedIn(Boolean(data.clockedIn));
    setOpenSinceIso(data.entry?.clockIn ?? null);
  }, [userId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    void loadEntries();
    void loadStatus();
  }, [loadEntries, loadStatus]);

  async function postJson(
    url: string,
    body: Record<string, string>,
  ): Promise<{ ok: boolean; data: unknown }> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function onClockIn() {
    setMessage(null);
    if (!userId) {
      setMessage({ type: "err", text: "Select your name first." });
      return;
    }
    setBusy(true);
    try {
      const { ok, data } = await postJson("/api/time-clock/clock-in", {
        userId,
      });
      if (!ok) {
        setMessage({
          type: "err",
          text:
            (data as { error?: string })?.error ??
            "Could not clock in.",
        });
        return;
      }
      setMessage({ type: "ok", text: "Clocked in." });
      await loadEntries();
      await loadStatus();
    } finally {
      setBusy(false);
    }
  }

  async function onClockOut() {
    setMessage(null);
    if (!userId) {
      setMessage({ type: "err", text: "Select your name first." });
      return;
    }
    setBusy(true);
    try {
      const { ok, data } = await postJson("/api/time-clock/clock-out", {
        userId,
      });
      if (!ok) {
        setMessage({
          type: "err",
          text:
            (data as { error?: string })?.error ??
            "Could not clock out.",
        });
        return;
      }
      setMessage({ type: "ok", text: "Clocked out." });
      await loadEntries();
      await loadStatus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Time clock</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Select your name, then clock in at the start of work and clock out
          when you finish. Download the full log as an Excel file anytime.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 sm:flex-row sm:items-end">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1.5 text-sm">
          <span className="text-zinc-400">Your name</span>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          >
            <option value="">— Select —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onClockIn()}
            disabled={busy || !userId || clockedIn}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clock in
          </button>
          <button
            type="button"
            onClick={() => void onClockOut()}
            disabled={busy || !userId || !clockedIn}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clock out
          </button>
          <a
            href="/api/time-clock/export"
            className="inline-flex items-center justify-center rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700"
          >
            Download Excel log
          </a>
        </div>
      </div>

      {clockedIn && openSinceIso && userId ? (
        <p className="rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          You are clocked in since {formatLocal(openSinceIso)}.
        </p>
      ) : null}

      {message ? (
        <p
          className={
            message.type === "ok"
              ? "text-sm text-emerald-400"
              : "text-sm text-red-400"
          }
        >
          {message.text}
        </p>
      ) : null}

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">
          Recent entries
          {userId ? " (your sessions)" : " (everyone)"}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Clock in</th>
                <th className="px-3 py-2 font-medium">Clock out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-zinc-500"
                  >
                    No entries yet.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-900/40">
                    <td className="px-3 py-2 text-zinc-200">{e.user.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-300">
                      {formatLocal(e.clockIn)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-300">
                      {e.clockOut ? formatLocal(e.clockOut) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
