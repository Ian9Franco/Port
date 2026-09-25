"use client";

import { useState } from "react";

export function RadarButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/radar", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Radar failed");
      setMessage(payload.message);
      if (payload.mode === "local_script") {
        window.location.reload();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {loading ? "Running radar…" : "Run Opportunity Radar"}
      </button>
      {message ? <p className="max-w-xs text-right text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}
