"use client";

import { useEffect, useState } from "react";
import { translationSource, type ListingLanguage } from "@/lib/listing-language";
import { chunkForTranslation } from "@/lib/text-chunks";

type State =
  | { status: "spanish" }
  | { status: "empty" }
  | { status: "loading"; done: number; total: number }
  | { status: "done"; translation: string; truncated: boolean }
  | { status: "error"; message: string };

async function translateChunk(text: string, sourceLang: ListingLanguage, signal: AbortSignal): Promise<string> {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLang }),
    signal
  });
  const data = await response.json() as { ok?: boolean; translation?: string; error?: string };
  if (!response.ok || !data.ok || !data.translation) {
    throw new Error(data.error || "MyMemory no devolvió una traducción.");
  }
  return data.translation;
}

function initialState(text: string): State {
  const trimmed = text.trim();
  if (!trimmed) return { status: "empty" };
  if (!translationSource(trimmed)) return { status: "spanish" };
  return { status: "loading", done: 0, total: 0 };
}

export function ListingTranslation({ text }: { text: string }) {
  const [state, setState] = useState<State>(() => initialState(text));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      setState({ status: "empty" });
      return;
    }
    const source = translationSource(trimmed);
    if (!source) {
      setState({ status: "spanish" });
      return;
    }

    const { chunks, truncated } = chunkForTranslation(trimmed);
    const controller = new AbortController();
    let active = true;
    setState({ status: "loading", done: 0, total: chunks.length });

    async function run() {
      const parts: string[] = [];
      try {
        for (let index = 0; index < chunks.length; index += 1) {
          const chunk = chunks[index];
          if (!chunk) continue;
          parts.push(await translateChunk(chunk, source as ListingLanguage, controller.signal));
          if (active) setState({ status: "loading", done: index + 1, total: chunks.length });
        }
        if (!active) return;
        setState({ status: "done", translation: parts.join(" "), truncated });
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        const message = error instanceof Error && error.message ? error.message : "MyMemory no respondió.";
        setState({ status: "error", message });
      }
    }

    void run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [text, attempt]);

  return (
    <div className="min-w-0" aria-live="polite">
      <h3 className="text-sm font-semibold text-zinc-200">Traducción</h3>
      {state.status === "spanish" ? (
        <p className="mt-2 text-sm text-zinc-400">El aviso ya está en español.</p>
      ) : null}
      {state.status === "empty" ? (
        <p className="mt-2 text-sm text-zinc-400">No hay descripción para traducir.</p>
      ) : null}
      {state.status === "loading" ? (
        <p className="mt-2 text-sm text-zinc-400">
          Traduciendo{state.total ? ` (${state.done}/${state.total})` : "…"}
        </p>
      ) : null}
      {state.status === "error" ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-amber-300">{state.message}</p>
          <button
            type="button"
            onClick={() => setAttempt(value => value + 1)}
            className="min-h-11 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Reintentar traducción
          </button>
        </div>
      ) : null}
      {state.status === "done" ? (
        <div className="mt-2 space-y-2">
          <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{state.translation}</p>
          {state.truncated ? (
            <p className="text-xs text-zinc-500">
              Se tradujo el comienzo. El resto queda en el original: MyMemory gratis limita el largo.
            </p>
          ) : (
            <p className="text-xs text-zinc-500">Traducción automática de MyMemory, sin clave.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
