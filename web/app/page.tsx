import Link from "next/link";
import { OpportunityCard } from "@/components/OpportunityCard";
import { RadarButton } from "@/components/RadarButton";
import { loadPortDatabase, pickByIds } from "@/lib/port-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await loadPortDatabase();
  const main = pickByIds(data.opportunities, data.top_picks?.main ?? []);
  const side = pickByIds(data.opportunities, data.top_picks?.side ?? []);

  const statusCounts = data.opportunities.reduce<Record<string, number>>((acc, job) => {
    const key = job.status ?? "new";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Port</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Private dashboard · datos de <code className="text-zinc-300">data/opportunities.json</code>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Última corrida: {data.generated_at ? new Date(data.generated_at).toLocaleString() : "—"}
          </p>
        </div>
        <RadarButton />
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(statusCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([status, count]) => (
            <div key={status} className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
              <p className="text-xs uppercase text-zinc-500">{status}</p>
              <p className="text-lg font-semibold">{count}</p>
            </div>
          ))}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-medium">MAIN — Top picks</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {main.length ? main.map(job => <OpportunityCard key={job.id} job={job} track="MAIN" />) : (
            <p className="text-sm text-zinc-500">Sin picks MAIN en esta corrida.</p>
          )}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-medium">SIDE — Top picks</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {side.length ? side.map(job => <OpportunityCard key={job.id} job={job} track="SIDE" />) : (
            <p className="text-sm text-zinc-500">Sin picks SIDE en esta corrida.</p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Universe (top 30 by rank)</h2>
          <Link href="/opportunities" className="text-sm text-emerald-400 hover:underline">
            Ver todas
          </Link>
        </div>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
          {[...data.opportunities]
            .sort((a, b) => (b.main_score ?? 0) - (a.main_score ?? 0))
            .slice(0, 30)
            .map(job => (
              <li key={job.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-900/50">
                <div className="min-w-0">
                  <Link href={`/opportunity/${encodeURIComponent(job.id)}`} className="font-medium text-zinc-100 hover:underline">
                    {job.title}
                  </Link>
                  <p className="truncate text-sm text-zinc-500">{job.company} · {job.status}</p>
                </div>
                <span className="text-sm tabular-nums text-zinc-400">{job.main_score ?? "—"}</span>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}
