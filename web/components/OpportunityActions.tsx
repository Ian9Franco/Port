"use client";

import { useState } from "react";
import { useOpportunityAction } from "@/components/use-opportunity-action";
import { OPPORTUNITY_ACTIONS } from "@/lib/opportunity-actions";

export function OpportunityActions({ id }: { id: string }) {
  const { busy, error, send } = useOpportunityAction(id);
  const [note, setNote] = useState("");

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h2 className="text-sm font-semibold text-zinc-200">Actions</h2>
      <textarea
        value={note}
        onChange={event => setNote(event.target.value)}
        placeholder="Note (optional)"
        aria-label="Note"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-base text-zinc-100"
        rows={2}
      />
      <div className="flex flex-wrap gap-2">
        {OPPORTUNITY_ACTIONS.map(item => (
          <button
            key={item.action}
            type="button"
            disabled={busy}
            onClick={() => send(item.action, note)}
            className="min-h-11 rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>
      {error ? <p className="break-words text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
