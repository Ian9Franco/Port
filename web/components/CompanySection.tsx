"use client";

import { useEffect, useState } from "react";
import { trustReadout, type StoredTrust } from "@/lib/trust-copy";

type Lookup =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "miss"; message: string }
  | {
      status: "hit";
      label: string;
      description: string | null;
      extract: string | null;
      wikipediaUrl: string | null;
      recordUrl: string | null;
      website: string | null;
      linkedinOnly: boolean;
      typeNote: string | null;
      source: string;
    };

export function CompanySection({
  company,
  site,
  trust
}: {
  company: string;
  site: string | null;
  trust?: StoredTrust | null;
}) {
  const notes = trustReadout(trust);
  const [lookup, setLookup] = useState<Lookup>({ status: "idle" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const name = company.trim();
    if (name.length < 2) {
      setLookup({ status: "miss", message: "El aviso no trae un nombre de empresa para buscar." });
      return;
    }
    const controller = new AbortController();
    let active = true;
    setLookup({ status: "loading" });

    async function run() {
      try {
        const response = await fetch(`/api/company-lookup?name=${encodeURIComponent(name)}`, {
          signal: controller.signal
        });
        const data = await response.json() as {
          ok?: boolean;
          matched?: boolean;
          message?: string;
          error?: string;
          label?: string;
          description?: string | null;
          extract?: string | null;
          wikipediaUrl?: string | null;
          recordUrl?: string | null;
          website?: string | null;
          linkedinOnly?: boolean;
          typeNote?: string | null;
          source?: string;
        };
        if (!active) return;
        if (!response.ok || data.ok === false) {
          setLookup({ status: "error", message: data.error || "No se pudo consultar la ficha pública." });
          return;
        }
        if (!data.matched) {
          setLookup({ status: "miss", message: data.message || "Nada en Wikidata ni en Wikipedia coincide con este nombre." });
          return;
        }
        setLookup({
          status: "hit",
          label: data.label || name,
          description: data.description ?? null,
          extract: data.extract ?? null,
          wikipediaUrl: data.wikipediaUrl ?? null,
          recordUrl: data.recordUrl ?? null,
          website: data.website ?? null,
          linkedinOnly: Boolean(data.linkedinOnly),
          typeNote: data.typeNote ?? null,
          source: data.source || "wikidata"
        });
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        const message = error instanceof Error && error.name === "AbortError"
          ? ""
          : "No se pudo consultar la ficha pública.";
        if (message) setLookup({ status: "error", message });
      }
    }

    void run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [company, attempt]);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-300">
      <h2 className="text-sm font-semibold text-zinc-200">Empresa</h2>
      <dl className="mt-3 space-y-3">
        <div>
          <dt className="text-zinc-500">Nombre en el aviso</dt>
          <dd className="break-words">{company.trim() || "No informado"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Sitio en el aviso</dt>
          <dd className="break-words">
            {site ? (
              <a href={site} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">{site}</a>
            ) : (
              "El aviso no trae sitio de la empresa."
            )}
          </dd>
        </div>
      </dl>

      <h3 className="mt-4 text-sm font-semibold text-zinc-200">Notas de confianza ya guardadas</h3>
      <p className="mt-1 text-xs text-zinc-500">Son marcas del radar sobre el aviso, no una investigación de la empresa.</p>
      {notes.missing ? (
        <p className="mt-2 text-amber-300">Esta ficha no trae notas de confianza.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          <li>Confianza de empresa: {notes.companyTrust}.</li>
          <li>Riesgo del aviso: {notes.listingRisk}.</li>
          <li>Confianza de la fuente: {notes.sourceTrust}.</li>
          {notes.signals.map(signal => <li key={signal}>{signal}</li>)}
          {notes.warnings.map(warning => <li key={warning} className="text-amber-300">{warning}</li>)}
          {!notes.signals.length && !notes.warnings.length ? <li>Sin señales ni advertencias guardadas.</li> : null}
        </ul>
      )}

      <h3 className="mt-4 text-sm font-semibold text-zinc-200">Consulta pública</h3>
      <p className="mt-1 text-xs text-zinc-500">Wikidata o Wikipedia, sin clave. No se abre LinkedIn.</p>
      <div className="mt-2" aria-live="polite">
        {lookup.status === "loading" || lookup.status === "idle" ? (
          <p className="text-zinc-400">Buscando una ficha pública…</p>
        ) : null}
        {lookup.status === "error" ? (
          <div className="space-y-2">
            <p className="text-amber-300">{lookup.message}</p>
            <button
              type="button"
              onClick={() => setAttempt(value => value + 1)}
              className="min-h-11 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Reintentar consulta
            </button>
          </div>
        ) : null}
        {lookup.status === "miss" ? <p>{lookup.message}</p> : null}
        {lookup.status === "hit" ? (
          <div className="space-y-2">
            <p className="break-words font-medium text-zinc-100">{lookup.label}</p>
            {lookup.description ? <p className="break-words">{lookup.description}</p> : null}
            {lookup.typeNote ? <p className="text-xs text-zinc-500">{lookup.typeNote}</p> : null}
            {lookup.extract ? <p className="break-words whitespace-pre-wrap leading-relaxed">{lookup.extract}</p> : null}
            {lookup.website ? (
              <p className="break-words">
                Sitio público:{" "}
                <a href={lookup.website} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                  {lookup.website}
                </a>
              </p>
            ) : null}
            {lookup.linkedinOnly ? <p>La ficha pública solo apunta a LinkedIn. Copenhagen no lo abre.</p> : null}
            <p className="flex flex-wrap gap-3">
              {lookup.wikipediaUrl ? (
                <a href={lookup.wikipediaUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                  Abrir Wikipedia
                </a>
              ) : null}
              {lookup.recordUrl && lookup.source === "wikidata" ? (
                <a href={lookup.recordUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                  Abrir Wikidata
                </a>
              ) : null}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
