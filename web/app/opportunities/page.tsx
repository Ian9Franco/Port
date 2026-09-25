import Link from "next/link";
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
          <li key={job.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-900/50">
            <div className="min-w-0">
              <Link href={`/opportunity/${encodeURIComponent(job.id)}`} className="font-medium hover:underline">
                {job.title}
              </Link>
              <p className="text-sm text-zinc-500">{job.company} · {job.source} · {job.status}</p>
            </div>
            <div className="text-right text-sm text-zinc-400">
              <div>MAIN {job.main_score ?? "—"}</div>
              <div>SIDE {job.side_score ?? "—"}</div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
