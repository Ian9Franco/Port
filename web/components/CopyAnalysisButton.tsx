"use client";

import { useState } from "react";

export function CopyAnalysisButton({ prompt }: { prompt: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copy}
          className="min-h-11 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
        >
          Copiar análisis
        </button>
        <p className="text-sm text-zinc-400" aria-live="polite">
          {status === "copied" ? "Copiado. Pegalo en el chat que ya usás." : null}
          {status === "error" ? "No se pudo copiar solo. El texto está abajo para seleccionarlo." : null}
          {status === "idle" ? "Un prompt en español con Ian y este aviso. No llama a una API." : null}
        </p>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-zinc-300">Ver el texto del análisis</summary>
        <textarea
          readOnly
          value={prompt}
          aria-label="Texto del análisis"
          className="mt-2 h-56 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-200"
        />
      </details>
    </div>
  );
}
