import Link from "next/link";
import { notFound } from "next/navigation";
import { OpportunityActions } from "@/components/OpportunityActions";
import { loadPortDatabase } from "@/lib/port-data";

export const dynamic = "force-dynamic";

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const data = await loadPortDatabase();
  const job = data.opportunities.find(row => row.id === decodedId);
  if (!job) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-emerald-400 hover:underline">← Dashboard</Link>
      <header className="mt-4 border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-semibold">{job.title}</h1>
        <p className="text-zinc-400">{job.company}</p>
        <p className="mt-2 text-sm text-zinc-500">
          {job.location} · {job.employment_type} · {job.source} · <span className="text-zinc-300">{job.status}</span>
        </p>
        <a href={job.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-emerald-400 hover:underline">
          Abrir listing original
        </a>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Scores</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-zinc-500">MAIN rank</dt><dd>{job.main_score ?? "—"}</dd></div>
              <div><dt className="text-zinc-500">SIDE rank</dt><dd>{job.side_score ?? "—"}</dd></div>
              <div><dt className="text-zinc-500">Current fit</dt><dd>{job.potential?.current_fit ?? "—"}</dd></div>
              <div><dt className="text-zinc-500">Career potential</dt><dd>{job.potential?.career_potential ?? "—"}</dd></div>
              <div><dt className="text-zinc-500">Transferability</dt><dd>{job.potential?.transferability ?? "—"}</dd></div>
              <div><dt className="text-zinc-500">Gap cost</dt><dd>{job.potential?.gap_cost ?? "—"}</dd></div>
            </dl>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Why it appeared</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
              {(job.potential?.reasons ?? ["No reasons stored."]).map(reason => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Gaps</h2>
            <ul className="mt-2 space-y-1 text-sm text-zinc-300">
              {(job.potential?.gaps ?? []).length
                ? job.potential!.gaps!.map(gap => (
                    <li key={gap.term}>{gap.term} ({gap.type})</li>
                  ))
                : <li>None highlighted.</li>}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-300">
            <h2 className="text-sm font-semibold text-zinc-200">Description</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{job.description ?? "—"}</p>
          </section>
        </div>

        <div className="space-y-4">
          <OpportunityActions id={job.id} />
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm">
            <h2 className="font-semibold text-zinc-200">Trust</h2>
            <p className="mt-2 text-zinc-400">Listing risk: {job.trust?.listing_risk ?? "—"}</p>
            <p className="text-zinc-400">Company trust: {job.trust?.company_trust ?? "—"}</p>
            {job.trust?.warnings?.length ? (
              <p className="mt-2 text-xs text-amber-400">{job.trust.warnings.join(", ")}</p>
            ) : null}
          </section>
          {job.notes ? (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-300">
              <h2 className="font-semibold text-zinc-200">Notes</h2>
              <p className="mt-2">{job.notes}</p>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
