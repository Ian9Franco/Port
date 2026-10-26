import Link from "next/link";
import { JobRow } from "@/components/JobRow";
import { opportunityHref } from "@/lib/opportunity-href";
import { loadPortDatabase } from "@/lib/port-data";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const data = await loadPortDatabase();
  const rows = [...data.opportunities].sort((a, b) => (b.main_score ?? 0) - (a.main_score ?? 0));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-emerald-400 hover:underline">← Dashboard</Link>
      <h1 className="mt-4 text-2xl font-semibold">All opportunities ({rows.length})</h1>
      <ul className="mt-6 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {rows.map(job => (
          <JobRow
            key={job.id}
            href={opportunityHref(job.id)}
            title={job.title}
            meta={`${job.company} · ${job.source} · ${job.status}`}
            aside={
              <>
                <span className="block">MAIN {job.main_score ?? "—"}</span>
                <span className="block">SIDE {job.side_score ?? "—"}</span>
              </>
            }
          />
        ))}
      </ul>
    </main>
  );
}
