export function opportunityHref(id: string): string {
  return `/opportunity?id=${encodeURIComponent(id)}`;
}
