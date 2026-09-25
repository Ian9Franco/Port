import Link from "next/link";
import type { PortOpportunity } from "@/lib/port-data";

export function OpportunityCard({ job, track }: { job: PortOpportunity; track: "MAIN" | "SIDE" }) {
  const score = track === "MAIN" ? job.main_score : job.side_score;
  return (
    <Link
      href={`/opportunity/${job.id}`}
      className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-600"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">{track}</span>
        <span className="text-xs text-zinc-500">Rank {score ?? "—"}</span>
      </div>
      <h3 className="font-medium text-zinc-50">{job.title}</h3>
      <p className="text-sm text-zinc-400">{job.company}</p>
      <p className="mt-2 text-xs text-zinc-500">
        Fit {job.potential?.current_fit ?? "—"} · Potencial {job.potential?.career_potential ?? "—"} · Riesgo{" "}
        {job.trust?.listing_risk ?? "—"}
      </p>
    </Link>
  );
}
