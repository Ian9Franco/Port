import { hostnameOf, safeHttpUrl } from "./http-url";

const BOARD_HOSTS = [
  "remotive.com",
  "arbeitnow.com",
  "getonbrd.com",
  "remoteok.com",
  "jobicy.com",
  "himalayas.app",
  "linkedin.com"
];

function isBoardHost(url: string): boolean {
  const host = hostnameOf(url);
  return BOARD_HOSTS.some(board => host === board || host.endsWith("." + board));
}

/** A company site only when the listing stored one. Board and LinkedIn URLs do not count. */
export function listingCompanySite(job: {
  company_url?: string;
  company_website?: string;
  website?: string;
}): string | null {
  for (const value of [job.company_url, job.company_website, job.website]) {
    const url = safeHttpUrl(value);
    if (!url || isBoardHost(url)) continue;
    return url;
  }
  return null;
}
