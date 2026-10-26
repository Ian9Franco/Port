"use client";

import { useOpportunityAction } from "@/components/use-opportunity-action";
import { OPPORTUNITY_ACTIONS } from "@/lib/opportunity-actions";

const idleClass = "border-zinc-700 text-zinc-200 hover:bg-zinc-800";
const activeClass = "border-emerald-600 bg-emerald-950 text-emerald-200";

export function QuickStatus({ id, status }: { id: string; status?: string }) {
  const { busy, error, send } = useOpportunityAction(id);

  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Estado">
        {OPPORTUNITY_ACTIONS.map(item => {
          const active = status === item.status;
          return (
            <button
              key={item.action}
              type="button"
              disabled={busy}
              aria-pressed={active}
              onClick={() => send(item.action)}
              className={`min-h-11 rounded-md border px-1 py-1 text-center text-sm font-medium leading-tight disabled:opacity-50 ${active ? activeClass : idleClass}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-2 break-words text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
