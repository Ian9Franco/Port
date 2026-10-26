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
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="min-h-11 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Running radar…" : "Run Opportunity Radar"}
      </button>
      {message ? <p className="break-words text-sm text-zinc-400 sm:max-w-xs sm:text-right">{message}</p> : null}
    </div>
  );
}
