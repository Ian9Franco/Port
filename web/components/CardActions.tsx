import { QuickStatus } from "@/components/QuickStatus";
import { listingUrl } from "@/lib/listing-url";

export function CardActions({
  id,
  status,
  url,
  applyUrl
}: {
  id: string;
  status?: string;
  url?: string;
  applyUrl?: string;
}) {
  const external = listingUrl({ url, apply_url: applyUrl });

  return (
    <div className="space-y-2">
      {external ? (
        <a
          href={external}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-emerald-800/80 bg-emerald-950/30 px-3 text-sm font-medium text-emerald-300 hover:bg-emerald-900/40"
        >
          Ver aviso
        </a>
      ) : null}
      <QuickStatus id={id} status={status} />
    </div>
  );
}
