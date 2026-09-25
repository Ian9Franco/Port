import fs from "node:fs/promises";
import crypto from "node:crypto";

const CONFIG_PATH = "config/radar.json";
const DATA_PATH = "data/opportunities.json";
const REPORT_PATH = "reports/latest.md";

const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));

function stripHtml(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedText(...parts) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function stableId(source, externalId, url) {
  if (externalId !== undefined && externalId !== null && String(externalId).length) {
    return source + "-" + externalId;
  }
  return source + "-" + crypto.createHash("sha1").update(url).digest("hex").slice(0, 14);
}

function parseDate(value) {
  if (!value) return null;
  if (typeof value === "number") {
    const millis = value > 10000000000 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeEmployment(value = "") {
  const text = String(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (text.includes("part")) return "part_time";
  if (text.includes("contract")) return "contract";
  if (text.includes("freelance")) return "freelance";
  if (text.includes("full")) return "full_time";
  if (text.includes("intern")) return "internship";
  return text || "unknown";
}

function classifyLocation(location = "") {
  const text = String(location).toLowerCase();
  if (!text.trim() || text === "remote") return { access: "unclear", delta: 0 };

  if (config.location.remote_now_terms.some(term => text.includes(term.toLowerCase()))) {
    return { access: "remote-now", delta: config.location.remote_now_bonus };
  }

  if (config.location.relocation_terms.some(term => text.includes(term.toLowerCase()))) {
    return { access: "relocation-watch", delta: config.location.relocation_penalty };
  }

  return { access: "restricted-or-unclear", delta: config.location.restricted_penalty };
}

function scoreJob(job) {
  const titleText = normalizedText(job.title);
  const bodyText = normalizedText(job.title, job.description, ...(job.tags ?? []));
  let score = 0;
  const matched = [];

  for (const rule of config.roles.positive_keywords) {
    const term = rule.term.toLowerCase();
    if (bodyText.includes(term)) {
      const titleMultiplier = titleText.includes(term) ? 2 : 1;
      score += rule.weight * titleMultiplier;
      matched.push(rule.term);
    }
  }

  for (const rule of config.roles.negative_keywords) {
    const term = rule.term.toLowerCase();
    if (bodyText.includes(term)) {
      score += rule.weight;
    }
  }

  if (config.employment.preferred.includes(job.employment_type)) {
    score += config.employment.bonus;
  }

  const location = classifyLocation(job.location);
  score += location.delta;

  return {
    score,
    matched_keywords: [...new Set(matched)].slice(0, 8),
    access: location.access
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Port-Opportunity-Radar/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(response.status + " " + response.statusText + " from " + url);
  }

  return response.json();
}

async function fetchRemotive() {
  if (!config.sources.remotive.enabled) return [];
  const source = config.sources.remotive;
  const url = new URL(source.endpoint);
  url.searchParams.set("limit", String(source.limit ?? 200));

  const payload = await fetchJson(url);

  return (payload.jobs ?? []).map(job => ({
    id: stableId("remotive", job.id, job.url),
    source: "Remotive",
    external_id: String(job.id ?? ""),
    url: job.url,
    title: job.title ?? "",
    company: job.company_name ?? "",
    location: job.candidate_required_location ?? "Worldwide",
    remote: true,
    employment_type: normalizeEmployment(job.job_type),
    published_at: parseDate(job.publication_date),
    salary: job.salary ?? "",
    tags: [job.category].filter(Boolean),
    description: stripHtml(job.description).slice(0, 900)
  }));
}

async function fetchArbeitnow() {
  if (!config.sources.arbeitnow.enabled) return [];
  const source = config.sources.arbeitnow;
  const jobs = [];

  for (let page = 1; page <= (source.pages ?? 1); page += 1) {
    const url = new URL(source.endpoint);
    url.searchParams.set("page", String(page));
    const payload = await fetchJson(url);

    for (const job of payload.data ?? []) {
      if (!job.remote) continue;
      jobs.push({
        id: stableId("arbeitnow", job.slug, job.url),
        source: "Arbeitnow",
        external_id: String(job.slug ?? ""),
        url: job.url,
        title: job.title ?? "",
        company: job.company_name ?? "",
        location: job.location ?? "Remote",
        remote: Boolean(job.remote),
        employment_type: normalizeEmployment(job.job_types?.[0] ?? ""),
        published_at: parseDate(job.created_at),
        salary: "",
        tags: Array.isArray(job.tags) ? job.tags : [],
        description: stripHtml(job.description).slice(0, 900)
      });
    }

    if (!payload.links?.next) break;
  }

  return jobs;
}

function dedupe(jobs) {
  const seen = new Map();

  for (const job of jobs) {
    const urlKey = job.url?.replace(/\/$/, "").toLowerCase();
    const key = urlKey || job.id;
    if (!seen.has(key)) seen.set(key, job);
  }

  return [...seen.values()];
}

function daysOld(iso) {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

function escapeMd(value = "") {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function buildReason(job) {
  const parts = [];

  if (job.matched_keywords?.length) {
    parts.push("matches " + job.matched_keywords.slice(0, 4).join(", "));
  }

  if (job.access === "remote-now") {
    parts.push("location appears compatible with remote work from Argentina");
  }

  if (job.access === "relocation-watch") {
    parts.push("better suited to the Europe/relocation track");
  }

  if (job.employment_type && job.employment_type !== "unknown") {
    parts.push(job.employment_type.replace("_", " "));
  }

  return parts.join("; ") || "manual review recommended";
}

function makeReport(opportunities, sourceStats, generatedAt) {
  const remoteNow = opportunities
    .filter(job => job.access === "remote-now" || job.access === "unclear")
    .slice(0, config.retention.report_limit);

  const relocation = opportunities
    .filter(job => job.access === "relocation-watch")
    .slice(0, 8);

  const lines = [
    "# Opportunity Radar",
    "",
    "Generated: " + generatedAt,
    "",
    "Sources checked: Remotive (" + (sourceStats.Remotive ?? 0) + "), Arbeitnow (" + (sourceStats.Arbeitnow ?? 0) + ")",
    "",
    "## Best current remote matches",
    "",
    "| Score | Role | Company | Location | Type | Why it matched |",
    "| ---: | --- | --- | --- | --- | --- |"
  ];

  for (const job of remoteNow) {
    lines.push(
      "| " + job.score +
      " | [" + escapeMd(job.title) + "](" + job.url + ")" +
      " | " + escapeMd(job.company) +
      " | " + escapeMd(job.location) +
      " | " + escapeMd(job.employment_type) +
      " | " + escapeMd(buildReason(job)) + " |"
    );
  }

  if (!remoteNow.length) {
    lines.push("| — | No matches yet | — | — | — | — |");
  }

  lines.push("", "## Europe / relocation watchlist", "");

  if (relocation.length) {
    lines.push("| Score | Role | Company | Location | Why it matched |");
    lines.push("| ---: | --- | --- | --- | --- |");

    for (const job of relocation) {
      lines.push(
        "| " + job.score +
        " | [" + escapeMd(job.title) + "](" + job.url + ")" +
        " | " + escapeMd(job.company) +
        " | " + escapeMd(job.location) +
        " | " + escapeMd(buildReason(job)) + " |"
      );
    }
  } else {
    lines.push("No relocation-track matches in this run.");
  }

  lines.push(
    "",
    "## Notes",
    "",
    "- Scores are a triage signal, not a claim that a role is objectively better.",
    "- Open the original listing before applying; availability and location restrictions can change.",
    "- Remotive listings link back to Remotive as required by its public API terms.",
    "- Application status in data/opportunities.json is preserved across refreshes.",
    ""
  );

  return lines.join("\n");
}

let existing = { version: 2, opportunities: [] };

try {
  existing = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
} catch {
  // First run.
}

const priorById = new Map((existing.opportunities ?? []).map(job => [job.id, job]));
const generatedAt = new Date().toISOString();

const sourceResults = await Promise.allSettled([
  fetchRemotive(),
  fetchArbeitnow()
]);

const fetched = [];
const sourceStats = {};
const failures = [];

for (const result of sourceResults) {
  if (result.status === "fulfilled") {
    for (const job of result.value) {
      fetched.push(job);
      sourceStats[job.source] = (sourceStats[job.source] ?? 0) + 1;
    }
  } else {
    failures.push(String(result.reason));
  }
}

if (!fetched.length && failures.length) {
  throw new Error("All sources failed: " + failures.join(" | "));
}

const scored = dedupe(fetched)
  .map(job => {
    const scoring = scoreJob(job);
    const prior = priorById.get(job.id);

    return {
      ...job,
      ...scoring,
      status: prior?.status ?? "new",
      notes: prior?.notes ?? "",
      first_seen: prior?.first_seen ?? generatedAt,
      last_seen: generatedAt
    };
  })
  .filter(job => job.score >= config.retention.minimum_score)
  .filter(job => !job.published_at || daysOld(job.published_at) <= config.retention.max_age_days)
  .sort((a, b) => b.score - a.score || String(b.published_at).localeCompare(String(a.published_at)));

const protectedStatuses = new Set(["applied", "replied", "interview", "won"]);

for (const prior of priorById.values()) {
  if (protectedStatuses.has(prior.status) && !scored.some(job => job.id === prior.id)) {
    scored.push(prior);
  }
}

const opportunities = scored.slice(0, config.retention.max_opportunities);

await fs.mkdir("reports", { recursive: true });

await fs.writeFile(
  DATA_PATH,
  JSON.stringify(
    {
      version: 2,
      generated_at: generatedAt,
      source_failures: failures,
      opportunities
    },
    null,
    2
  ) + "\n"
);

await fs.writeFile(
  REPORT_PATH,
  makeReport(opportunities, sourceStats, generatedAt) + "\n"
);

console.log(
  "Radar complete: " +
  fetched.length +
  " fetched, " +
  opportunities.length +
  " retained, " +
  failures.length +
  " source failures."
);
