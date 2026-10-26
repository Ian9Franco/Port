import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanySection } from "@/components/CompanySection";
import { CopyAnalysisButton } from "@/components/CopyAnalysisButton";
import { JobReadout } from "@/components/JobReadout";
import { ListingTranslation } from "@/components/ListingTranslation";
import { OpportunityActions } from "@/components/OpportunityActions";
import { buildAnalysisPrompt } from "@/lib/analysis-prompt";
import { loadCareerModel } from "@/lib/career-files";
import { listingCompanySite } from "@/lib/company-site";
import { listingUrl } from "@/lib/listing-url";
import { containsMarkup, plainText } from "@/lib/plain-text";
import { loadPortDatabase, type PortOpportunity } from "@/lib/port-data";

export const dynamic = "force-dynamic";

export default async function OpportunityPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const [{ id }, data, career] = await Promise.all([
    searchParams,
    loadPortDatabase(),
    loadCareerModel().catch(() => null)
  ]);
  if (!id) notFound();

  const job = findJob(data.opportunities, id);
  if (!job) notFound();
  const externalListing = listingUrl(job);
  const description = plainText(job.description);
  const markup = containsMarkup(job.description);
  const site = listingCompanySite(job);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-emerald-400 hover:underline">← Copenhagen</Link>
      <header className="mt-4 border-b border-zinc-800 pb-6">
        <h1 className="text-balance break-words text-2xl font-semibold">{job.title}</h1>
        <p className="break-words text-zinc-400">{job.company}</p>
        <JobFacts job={job} />
        {externalListing ? (
          <a href={externalListing} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-emerald-400 hover:underline">
            Abrir listing original
          </a>
        ) : null}
      </header>

      <div className="mt-6">
        <CopyAnalysisButton prompt={buildAnalysisPrompt(job, career)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="order-2 min-w-0 space-y-6 lg:order-1 lg:col-span-2">
          <JobReadout job={job} />

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-300">
            <h2 className="text-sm font-semibold text-zinc-200">Descripción</h2>
            {markup ? (
              <p className="mt-1 text-xs text-zinc-500">Se quitaron etiquetas HTML del texto guardado.</p>
            ) : null}
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-zinc-200">Original</h3>
                <p className="mt-2 break-words whitespace-pre-wrap leading-relaxed">
                  {description || "Sin descripción guardada."}
                </p>
              </div>
              <ListingTranslation text={description} />
            </div>
          </section>

          <CompanySection company={job.company} site={site} trust={job.trust} />
        </div>

        <div className="order-1 min-w-0 space-y-4 lg:order-2">
          <OpportunityActions id={job.id} />
          {job.notes ? (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-300">
              <h2 className="font-semibold text-zinc-200">Notas</h2>
              <p className="mt-2 break-words">{job.notes}</p>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function findJob(opportunities: PortOpportunity[], id: string) {
  const direct = opportunities.find(row => row.id === id);
  if (direct) return direct;
  try {
    const decoded = decodeURIComponent(id);
    if (decoded === id) return undefined;
    return opportunities.find(row => row.id === decoded);
  } catch {
    return undefined;
  }
}

function JobFacts({ job }: { job: PortOpportunity }) {
  const facts = [job.employment_type, job.source, job.status]
    .filter((value): value is string => Boolean(value))
    .map(value => value.replaceAll("_", " "))
    .join(" · ");
  const location = job.location?.trim() ?? "";
  const long = location.length > 90;

  return (
    <div className="mt-2 space-y-1 text-sm text-zinc-500">
      {facts ? <p className="break-words text-zinc-300">{facts}</p> : null}
      {job.seniority?.trim() ? (
        <p className="break-words">Seniority del aviso: {job.seniority.trim()}</p>
      ) : (
        <p>Seniority del aviso: no indicado</p>
      )}
      {long ? (
        <details>
          <summary className="cursor-pointer break-words">
            {location.slice(0, 72).replace(/[,\s]+$/, "")}…
          </summary>
          <p className="mt-1 break-words">{location}</p>
        </details>
      ) : location ? (
        <p className="break-words">{location}</p>
      ) : null}
    </div>
  );
}
