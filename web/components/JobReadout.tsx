import type { PortOpportunity } from "@/lib/port-data";
import { gapRows, gapsUnknownNote, listingRows, placeRows, scoreRows, type ReadoutRow } from "@/lib/score-copy";

function Rows({ rows }: { rows: ReadoutRow[] }) {
  return (
    <dl className="mt-3 space-y-4">
      {rows.map(row => (
        <div key={row.id}>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">{row.label}</dt>
          <dd className="mt-1 break-words text-sm text-zinc-100">{row.value}</dd>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{row.meaning}</p>
          {row.unknown ? <p className="mt-1 text-xs leading-relaxed text-amber-300">{row.unknown}</p> : null}
        </div>
      ))}
    </dl>
  );
}

export function JobReadout({ job }: { job: PortOpportunity }) {
  const gaps = gapRows(job);
  const gapNote = gapsUnknownNote(job);

  return (
    <>
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">Puntajes</h2>
        <p className="mt-1 text-xs text-zinc-500">Qué mide cada número, y qué sigue sin saberse.</p>
        <Rows rows={[...listingRows(job), ...scoreRows(job), ...placeRows(job)]} />
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">Por qué apareció</h2>
        <p className="mt-1 text-xs text-zinc-500">Frases que guardó el radar. No son una conclusión.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
          {(job.potential?.reasons ?? []).length
            ? job.potential!.reasons!.map(reason => (
                <li key={reason} className="break-words">{reason}</li>
              ))
            : <li>No hay motivos guardados.</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">Huecos</h2>
        <ul className="mt-2 space-y-3 text-sm text-zinc-300">
          {gaps.length
            ? gaps.map(gap => (
                <li key={`${gap.typeLabel}-${gap.term}`} className="break-words">
                  <p className="text-zinc-100">{gap.term}</p>
                  <p className="text-xs text-zinc-400">{gap.typeLabel}. {gap.meaning}</p>
                </li>
              ))
            : null}
        </ul>
        {gapNote ? <p className="mt-2 text-xs leading-relaxed text-amber-300">{gapNote}</p> : null}
      </section>
    </>
  );
}
