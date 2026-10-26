import { namesMatch } from "./company-name";
import { safeHttpUrl } from "./http-url";

const USER_AGENT = "CopenhagenJobView/1.0 (https://github.com/Ian9Franco/copenhagen)";

const REJECT_QIDS = new Set([
  "Q5",
  "Q11424",
  "Q482994",
  "Q7366",
  "Q571",
  "Q515",
  "Q6256",
  "Q486972",
  "Q5633421",
  "Q13442814",
  "Q16521",
  "Q7725634"
]);

const ACCEPT_QIDS = new Set([
  "Q43229",
  "Q4830453",
  "Q6881511",
  "Q891723",
  "Q7397",
  "Q163740"
]);

const TYPE_LABEL: Record<string, string> = {
  Q43229: "organización",
  Q4830453: "empresa",
  Q6881511: "empresa",
  Q891723: "empresa que cotiza",
  Q7397: "software",
  Q163740: "organización sin fines de lucro"
};

const BAD_PAGE = /\b(city|ciudad|film|pelicula|película|album|álbum|song|cancion|canción|river|rio|río|mythology|mitolog|footballer|futbolista|planet|planeta|genus|species|human|persona)\b/i;
const GOOD_PAGE = /\b(company|empresa|software|organization|organizacion|organización|platform|plataforma|business|consultancy|consultora)\b/i;

export type PublicCompanyMatch = {
  ok: true;
  matched: true;
  label: string;
  description: string | null;
  extract: string | null;
  wikipediaUrl: string | null;
  recordUrl: string | null;
  website: string | null;
  linkedinOnly: boolean;
  typeNote: string | null;
  source: "wikidata" | "wikipedia";
};

export type PublicCompanyResult =
  | PublicCompanyMatch
  | { ok: true; matched: false; message: string }
  | { ok: false; error: string };

type SearchRow = {
  id?: string;
  label?: string;
  description?: string;
};

type Claim = {
  mainsnak?: { datavalue?: { value?: unknown } };
};

type Entity = {
  labels?: Record<string, { value?: string }>;
  descriptions?: Record<string, { value?: string }>;
  sitelinks?: Record<string, { title?: string }>;
  claims?: { P31?: Claim[]; P856?: Claim[] };
};

const NO_MATCH = "Nada en Wikidata ni en Wikipedia coincide con el nombre del aviso.";

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": USER_AGENT
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

function claimIds(claims: Claim[] | undefined): string[] {
  const ids: string[] = [];
  for (const claim of claims ?? []) {
    const value = claim.mainsnak?.datavalue?.value;
    if (value && typeof value === "object" && "id" in value && typeof value.id === "string") {
      ids.push(value.id);
    }
  }
  return ids;
}

function claimUrls(claims: Claim[] | undefined): string[] {
  const urls: string[] = [];
  for (const claim of claims ?? []) {
    const value = claim.mainsnak?.datavalue?.value;
    if (typeof value === "string") urls.push(value);
  }
  return urls;
}

function websiteFrom(urls: string[]): { website: string | null; linkedinOnly: boolean } {
  const http = urls.map(url => safeHttpUrl(url)).filter((url): url is string => Boolean(url));
  const usable = http.filter(url => !/linkedin\.com/i.test(new URL(url).hostname));
  if (usable[0]) return { website: usable[0], linkedinOnly: false };
  if (http.length) return { website: null, linkedinOnly: true };
  return { website: null, linkedinOnly: false };
}

function typeNote(qids: string[]): string | null {
  if (qids.some(id => REJECT_QIDS.has(id)) && !qids.some(id => ACCEPT_QIDS.has(id))) return null;
  const labels = qids.map(id => TYPE_LABEL[id]).filter(Boolean);
  if (labels.length) return [...new Set(labels)].join(", ");
  return "Wikidata no dice si es una empresa.";
}

function acceptableEntity(qids: string[]): boolean {
  if (qids.includes("Q5")) return false;
  const rejected = qids.some(id => REJECT_QIDS.has(id));
  const accepted = qids.some(id => ACCEPT_QIDS.has(id));
  if (rejected && !accepted) return false;
  return true;
}

async function wikiSummary(lang: "es" | "en", title: string): Promise<{
  title: string;
  extract: string | null;
  url: string | null;
  disambiguation: boolean;
} | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": USER_AGENT },
    cache: "no-store",
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) return null;
  const data = await response.json() as {
    type?: string;
    title?: string;
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
  };
  return {
    title: data.title || title,
    extract: typeof data.extract === "string" ? data.extract.slice(0, 900) : null,
    url: safeHttpUrl(data.content_urls?.desktop?.page ?? null),
    disambiguation: data.type === "disambiguation"
  };
}

async function fromWikidata(name: string): Promise<PublicCompanyMatch | null> {
  const searchUrl = new URL("https://www.wikidata.org/w/api.php");
  searchUrl.searchParams.set("action", "wbsearchentities");
  searchUrl.searchParams.set("search", name);
  searchUrl.searchParams.set("language", "en");
  searchUrl.searchParams.set("uselang", "es");
  searchUrl.searchParams.set("type", "item");
  searchUrl.searchParams.set("limit", "6");
  searchUrl.searchParams.set("format", "json");
  const payload = await getJson(searchUrl.toString()) as { search?: SearchRow[] };
  const rows = (payload.search ?? []).filter(row => row.id && row.label && namesMatch(name, row.label));
  if (!rows.length) return null;

  const entityUrl = new URL("https://www.wikidata.org/w/api.php");
  entityUrl.searchParams.set("action", "wbgetentities");
  entityUrl.searchParams.set("ids", rows.map(row => row.id).join("|"));
  entityUrl.searchParams.set("props", "labels|descriptions|sitelinks|claims");
  entityUrl.searchParams.set("languages", "es|en");
  entityUrl.searchParams.set("format", "json");
  const entities = await getJson(entityUrl.toString()) as { entities?: Record<string, Entity> };

  for (const row of rows) {
    const entity = entities.entities?.[row.id ?? ""];
    if (!entity) continue;
    const qids = claimIds(entity.claims?.P31);
    if (!acceptableEntity(qids)) continue;
    const label = entity.labels?.es?.value || entity.labels?.en?.value || row.label || name;
    const description = entity.descriptions?.es?.value || entity.descriptions?.en?.value || row.description || null;
    const site = entity.sitelinks?.eswiki?.title
      ? { lang: "es" as const, title: entity.sitelinks.eswiki.title }
      : entity.sitelinks?.enwiki?.title
        ? { lang: "en" as const, title: entity.sitelinks.enwiki.title }
        : null;
    const summary = site ? await wikiSummary(site.lang, site.title) : null;
    const pages = websiteFrom(claimUrls(entity.claims?.P856));
    const note = typeNote(qids);
    const wikiMissing = !summary || summary.disambiguation;
    const typed = note ? `${note}.` : null;
    return {
      ok: true,
      matched: true,
      label,
      description,
      extract: summary && !summary.disambiguation ? summary.extract : null,
      wikipediaUrl: summary && !summary.disambiguation ? summary.url : null,
      recordUrl: row.id ? `https://www.wikidata.org/wiki/${row.id}` : null,
      website: pages.website,
      linkedinOnly: pages.linkedinOnly,
      typeNote: wikiMissing
        ? [typed, "No hay un artículo de Wikipedia en español o inglés para esta ficha."].filter(Boolean).join(" ")
        : note,
      source: "wikidata"
    };
  }
  return null;
}

async function fromWikipedia(name: string): Promise<PublicCompanyMatch | null> {
  for (const lang of ["es", "en"] as const) {
    const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
    url.searchParams.set("action", "opensearch");
    url.searchParams.set("search", name);
    url.searchParams.set("limit", "5");
    url.searchParams.set("namespace", "0");
    url.searchParams.set("format", "json");
    const payload = await getJson(url.toString()) as unknown[];
    const titles = Array.isArray(payload[1]) ? payload[1].filter((item): item is string => typeof item === "string") : [];
    const blurbs = Array.isArray(payload[2]) ? payload[2] : [];
    for (let index = 0; index < titles.length; index += 1) {
      const title = titles[index];
      if (!title || !namesMatch(name, title)) continue;
      const blurb = typeof blurbs[index] === "string" ? blurbs[index] : "";
      if (BAD_PAGE.test(blurb) && !GOOD_PAGE.test(blurb)) continue;
      const summary = await wikiSummary(lang, title);
      if (!summary || summary.disambiguation) continue;
      if (summary.extract && BAD_PAGE.test(summary.extract) && !GOOD_PAGE.test(summary.extract) && !GOOD_PAGE.test(blurb)) {
        continue;
      }
      return {
        ok: true,
        matched: true,
        label: summary.title,
        description: blurb || null,
        extract: summary.extract,
        wikipediaUrl: summary.url,
        recordUrl: summary.url,
        website: null,
        linkedinOnly: false,
        typeNote: "Coincide el título de Wikipedia. Wikidata no aportó una ficha de empresa.",
        source: "wikipedia"
      };
    }
  }
  return null;
}

export async function lookupPublicCompany(name: string): Promise<PublicCompanyResult> {
  const query = name.trim();
  if (query.length < 2) return { ok: true, matched: false, message: "El aviso no trae un nombre de empresa para buscar." };

  let wikidataFailed = false;
  try {
    const hit = await fromWikidata(query);
    if (hit) return hit;
  } catch {
    wikidataFailed = true;
  }

  let wikipediaFailed = false;
  try {
    const hit = await fromWikipedia(query);
    if (hit) return hit;
  } catch {
    wikipediaFailed = true;
  }

  if (wikidataFailed && wikipediaFailed) return { ok: false, error: "No se pudo consultar Wikidata ni Wikipedia." };
  if (wikidataFailed) return { ok: false, error: "Wikidata no respondió y Wikipedia no tuvo una coincidencia clara." };
  if (wikipediaFailed) return { ok: false, error: "Wikipedia no respondió y Wikidata no tuvo una coincidencia clara." };
  return { ok: true, matched: false, message: NO_MATCH };
}
