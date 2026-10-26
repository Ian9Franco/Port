const HTTP_PROTOCOL = /^https?:$/;

type ListingSource = {
  url?: string | null;
  apply_url?: string | null;
};

function absoluteHttpUrl(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const protocol = new URL(trimmed).protocol;
    if (!HTTP_PROTOCOL.test(protocol)) return null;
    return trimmed;
  } catch {
    return null;
  }
}

/**
 * External posting URL: the stored listing url, or Himalayas `applicationLink`
 * when that is the only absolute URL. Himalayas ids embed a full URL
 * (`himalayas-https://...`), so this must never be built from the id or an
 * in-app path.
 */
export function listingUrl(job: ListingSource): string | null {
  return absoluteHttpUrl(job.url) ?? absoluteHttpUrl(job.apply_url);
}
