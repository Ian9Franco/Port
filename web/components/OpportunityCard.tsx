import Link from "next/link";
import { CardActions } from "@/components/CardActions";
import { opportunityHref } from "@/lib/opportunity-href";
import type { PortOpportunity } from "@/lib/port-data";

export function OpportunityCard({ job, track }: { job: PortOpportunity; track: "MAIN" | "SIDE" }) {
  const score = track === "MAIN" ? job.main_score : job.side_score;
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-600">
      <Link href={opportunityHref(job.id)} className="group block">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">{track}</span>
          <span className="text-xs text-zinc-500">Rank {score ?? "—"}</span>
        </div>
        <h3 className="text-pretty break-words font-medium text-zinc-50 group-hover:underline">{job.title}</h3>
        <p className="break-words text-sm text-zinc-400">{job.company}</p>
        <p className="mt-2 break-words text-xs text-zinc-500">
          Fit {job.potential?.current_fit ?? "—"} · Potencial {job.potential?.career_potential ?? "—"} · Riesgo{" "}
          {job.trust?.listing_risk ?? "—"}
        </p>
      </Link>
      <div className="mt-3">
        <CardActions id={job.id} status={job.status} url={job.url} applyUrl={job.apply_url} />
      </div>
    </article>
  );
}
