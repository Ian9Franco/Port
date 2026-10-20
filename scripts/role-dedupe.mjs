import crypto from "node:crypto";

const FAMILY_PATTERNS = [
  ["sap_functional", ["sap fico", "successfactors", "success factors", "sap basis", "sap hcm"]],
  ["sap", ["sap btp", "integration suite", "sap cap", "sap"]],
  ["devops", ["devops", "site reliability", "platform engineer"]],
  ["data", ["data engineer", "analytics engineer", "data analyst"]],
  ["full_stack", ["full stack", "full-stack", "fullstack", "backend"]],
  ["security", ["security engineer", "appsec", "cybersecurity"]],
  ["automation", ["automation"]],
  ["applied_ai", ["machine learning", "ai engineer", "ml engineer"]]
];

function companyKey(company) {
  const text = String(company ?? "")
    .toLowerCase()
    .replace(/\bs\.?\s*a\.?(?=$|[^a-z0-9])/g, " ")
    .replace(/[.&]/g, " ");
  return text
    .replace(/\b(inc|llc|ltd|gmbh|sa|srl|corp)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function primaryFamily(job) {
  const title = String(job?.title ?? "").toLowerCase();
  for (const [id, words] of FAMILY_PATTERNS) {
    if (words.some(word => title.includes(word))) return id;
  }
  const stem = title
    .replace(/\b(senior|sr|staff|principal|lead|head|junior|jr|director)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return "role:" + (stem || "unknown");
}

export function countryKey(job) {
  const text = String(job?.location ?? job?.place_text ?? "").toLowerCase();
  if (/valencia|spain|españa|espana/.test(text)) return "spain";
  if (/argentina|buenos aires|caba|amba|zona oeste/.test(text)) return "argentina";
  if (/worldwide|anywhere|global/.test(text)) return "worldwide";
  if (/\bchile\b/.test(text)) return "chile";
  const first = text.split(/[,|/]/).map(part => part.trim()).find(Boolean);
  return first || "unknown";
}

export function blockingKey(job) {
  return [companyKey(job?.company), primaryFamily(job), countryKey(job)].join("|");
}

export function canonicalUrl(url) {
  const value = String(url ?? "").trim();
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.search = "";
    const path = parsed.pathname.replace(/\/$/, "");
    return parsed.origin.toLowerCase() + path;
  } catch {
    return value.replace(/\/$/, "").toLowerCase();
  }
}

export function listingIdentity(job) {
  const url = canonicalUrl(job?.url);
  const stripped = String(job?.title ?? "")
    .toLowerCase()
    .replace(/\b(senior|sr|staff|principal|lead|head|junior|jr|director)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const title_hash = crypto.createHash("sha1").update(stripped).digest("hex").slice(0, 12);
  return { url, title_hash };
}

function intersects(left, right) {
  if (!left.size || !right.size) return false;
  for (const value of left) {
    if (right.has(value)) return true;
  }
  return false;
}

/**
 * Merge rows that share company + role family + country before a short list is cut.
 * The kept card stores the other URLs. The wider universe is left untouched.
 */
export function mergeByBlockingKey(jobs, scoreKey = "main_score") {
  const groups = new Map();
  for (const job of jobs) {
    const key = blockingKey(job);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(job);
  }

  const kept = [];
  for (const group of groups.values()) {
    const ranked = [...group].sort((a, b) =>
      (b[scoreKey] ?? 0) - (a[scoreKey] ?? 0) || String(a.title).localeCompare(String(b.title), "es")
    );
    const winner = { ...ranked[0] };
    const urls = [];
    for (const other of ranked.slice(1)) {
      if (other.url) urls.push(other.url);
      if (Array.isArray(other.merged_urls)) urls.push(...other.merged_urls);
    }
    winner.merged_urls = [...new Set(urls.filter(url => url && url !== winner.url))];
    winner.listing_identity = listingIdentity(winner);
    winner.blocking_key = blockingKey(winner);
    kept.push(winner);
  }
  return kept;
}

function attentionOrder(a, b, scoreKey) {
  const score = (b[scoreKey] ?? 0) - (a[scoreKey] ?? 0);
  if (score) return score;
  const bridge = (b.potential?.place_bridge ? 1 : 0) - (a.potential?.place_bridge ? 1 : 0);
  if (bridge) return bridge;
  return String(a.title ?? "").localeCompare(String(b.title ?? ""), "es")
    || String(b.published_at ?? "").localeCompare(String(a.published_at ?? ""));
}

export function shortList(jobs, scoreKey, limit, order = "score") {
  const merged = mergeByBlockingKey(jobs, scoreKey);
  const sorted = [...merged].sort((a, b) => {
    if (order === "title") {
      return String(a.title ?? "").localeCompare(String(b.title ?? ""), "es")
        || String(a.url ?? "").localeCompare(String(b.url ?? ""));
    }
    return attentionOrder(a, b, scoreKey);
  });
  return sorted.slice(0, limit);
}

/**
 * Short-list guard. Blocking key replaces the fixed token threshold.
 * The threshold argument remains so older call sites keep working.
 */
export function collapseNearDuplicates(jobs, scoreKey, _threshold = 0.64) {
  return shortList(jobs, scoreKey, jobs.length, "score");
}
