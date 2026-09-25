"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ACTIONS = [
  { action: "reviewing", label: "Reviewing" },
  { action: "shortlist", label: "Shortlist" },
  { action: "prepared", label: "Prepared" },
  { action: "applied", label: "Applied" },
  { action: "skip", label: "Skip" },
  { action: "lost", label: "Lost" }
];

export function OpportunityActions({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(action: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note || undefined })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Update failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h2 className="text-sm font-semibold text-zinc-200">Actions</h2>
      <textarea
        value={note}
        onChange={event => setNote(event.target.value)}
        placeholder="Note (optional)"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        rows={2}
      />
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(item => (
          <button
            key={item.action}
            type="button"
            disabled={busy}
            onClick={() => send(item.action)}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
