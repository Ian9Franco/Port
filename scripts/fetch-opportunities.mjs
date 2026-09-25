import fs from "node:fs/promises";
import crypto from "node:crypto";
import { loadCareerModel } from "./load-career-model.mjs";
import { evaluatePotential } from "./potential-matcher.mjs";
import { applyTrustToOpportunity, markDuplicateClusters } from "./trust-layer.mjs";

const CONFIG_PATH = "config/radar.json";
const DATA_PATH = "data/opportunities.json";
const REPORT_PATH = "reports/latest.md";
const ALL_PATH = "reports/all-candidates.md";
const PREP_PATH = "reports/application-prep.md";

const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
const careerModel = await loadCareerModel();
const matcherProfile = careerModel.matcher_profile;

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
    return source + "-" + String(externalId);
  }
  return source + "-" + crypto.createHash("sha1").update(String(url)).digest("hex").slice(0, 14);
}

function parseDate(value) {
  if (!value) return null;
  if (typeof value === "number") {
    const millis = value > 10_000_000_000 ? value : value * 1000;
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url, { retries = 3, timeoutMs = 45_000 } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          accept: "application/json",
          "user-agent": "Port-Opportunity-Radar/2.0"
        }
      });

      if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
        throw new Error(response.status + " " + response.statusText + " from " + url);
      }

      if (!response.ok) {
        throw new Error(response.status + " " + response.statusText + " from " + url);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json") && !contentType.includes("+json")) {
        throw new Error("Non-JSON response (" + contentType + ") from " + url);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const backoffMs = Math.min(8_000, 750 * 2 ** (attempt - 1));
        await sleep(backoffMs);
      }
    }
  }

  throw lastError;
}

function textIncludesAny(text, terms) {
  return terms.some(term => text.includes(term.toLowerCase()));
}

function classifyAccess(job) {
  const text = normalizedText(job.location);
  const remoteNow = textIncludesAny(text, config.location.remote_now_terms);
  const local = textIncludesAny(text, config.location.local_area_terms);
  const relocation = textIncludesAny(text, config.location.relocation_terms);

  if (job.remote) {
    if (remoteNow || local) return "remote-now";
    if (relocation) return "relocation-watch";
    if (!text || text === "remote" || text === "remoto") return "remote-unclear";
    return "restricted-remote";
  }

  if (local) return "local-onsite";
  if (relocation) return "relocation-watch";
  return "nonlocal-onsite";
}

function scoreRules(text, titleText, rules) {
  let score = 0;
  const matched = [];

  for (const rule of rules) {
    const term = rule.term.toLowerCase();
    if (text.includes(term)) {
      const multiplier = titleText.includes(term) ? 2 : 1;
      score += rule.weight * multiplier;
      matched.push(rule.term);
    }
  }

  return { score, matched };
}

function scoreOpportunity(job) {
  const titleText = normalizedText(job.title);
  const bodyText = normalizedText(job.title, job.description, ...(job.tags ?? []));
  const positive = scoreRules(bodyText, titleText, config.roles.positive_keywords);
  const negative = scoreRules(bodyText, titleText, config.roles.negative_keywords);
  const access = classifyAccess(job);

  const mainSignals = scoreRules(bodyText, titleText, config.tracks.main.signals);
  let mainScore = positive.score + negative.score + mainSignals.score;

  if (config.tracks.main.preferred_employment.includes(job.employment_type)) {
    mainScore += config.tracks.main.employment_bonus;
  }

  if (access === "remote-now") mainScore += config.tracks.main.remote_bonus;
  if (access === "remote-unclear") mainScore += 1;
  if (access === "local-onsite") mainScore += config.tracks.main.local_bonus;
  if (access === "relocation-watch") mainScore += config.tracks.main.relocation_penalty;
  if (access === "nonlocal-onsite") mainScore += config.tracks.main.nonlocal_onsite_penalty;
  if (access === "restricted-remote") mainScore -= 10;

  const sideSignals = scoreRules(bodyText, titleText, config.tracks.side.signals);
  let sideScore = positive.score + negative.score + sideSignals.score;

  if (config.tracks.side.preferred_employment.includes(job.employment_type)) {
    sideScore += config.tracks.side.employment_bonus;
  }

  if (access === "remote-now") sideScore += 3;
  if (access === "restricted-remote" || !job.remote) sideScore -= 20;

  const sideNature =
    config.tracks.side.preferred_employment.includes(job.employment_type) ||
    sideSignals.matched.length > 0;

  const mainEligibleNow =
    mainScore >= config.tracks.main.minimum_score &&
    ["remote-now", "remote-unclear", "local-onsite"].includes(access);

  const sideEligible =
    sideScore >= config.tracks.side.minimum_score &&
    job.remote === true &&
    ["remote-now", "remote-unclear"].includes(access) &&
    sideNature &&
    job.employment_type !== "full_time";

  const relocationWatch =
    mainScore >= config.tracks.main.minimum_score &&
    access === "relocation-watch";

  return {
    base_score: positive.score + negative.score,
    keyword_main_score: mainScore,
    keyword_side_score: sideScore,
    main_eligible_now: mainEligibleNow,
    side_eligible: sideEligible,
    relocation_watch: relocationWatch,
    access,
    matched_keywords: [...new Set(positive.matched)].slice(0, 10),
    main_signals: [...new Set(mainSignals.matched)].slice(0, 6),
    side_signals: [...new Set(sideSignals.matched)].slice(0, 6),
    negative_hits: negative.matched.length
  };
}

async function fetchRemotive() {
  const source = config.sources.remotive;
  if (!source.enabled) return [];

  const url = new URL(source.endpoint);
  url.searchParams.set("limit", String(source.limit ?? 200));
  const payload = await fetchJson(url);

  return (payload.jobs ?? []).map(job => ({
    id: stableId("remotive", job.id, job.url),
    source: "Remotive",
    source_trust: source.trust,
    external_id: String(job.id ?? ""),
    url: job.url,
    title: job.title ?? "",
    company: job.company_name ?? "",
    location: job.candidate_required_location ?? "Worldwide",
    remote: true,
    workplace: "remote",
    employment_type: normalizeEmployment(job.job_type),
    published_at: parseDate(job.publication_date),
    salary: job.salary ?? "",
    tags: [job.category].filter(Boolean),
    description: stripHtml(job.description).slice(0, 1600)
  }));
}

async function fetchArbeitnow() {
  const source = config.sources.arbeitnow;
  if (!source.enabled) return [];

  const jobs = [];

  for (let page = 1; page <= (source.pages ?? 1); page += 1) {
    const url = new URL(source.endpoint);
    url.searchParams.set("page", String(page));
    const payload = await fetchJson(url, { retries: 4 });
    if (page < (source.pages ?? 1)) await sleep(250);

    for (const job of payload.data ?? []) {
      if (!job.remote) continue;
      jobs.push({
        id: stableId("arbeitnow", job.slug, job.url),
        source: "Arbeitnow",
        source_trust: source.trust,
        external_id: String(job.slug ?? ""),
        url: job.url,
        title: job.title ?? "",
        company: job.company_name ?? "",
        location: job.location ?? "Remote",
        remote: Boolean(job.remote),
        workplace: "remote",
        employment_type: normalizeEmployment(job.job_types?.[0] ?? ""),
        published_at: parseDate(job.created_at),
        salary: "",
        tags: Array.isArray(job.tags) ? job.tags : [],
        description: stripHtml(job.description).slice(0, 1600)
      });
    }

    if (!payload.links?.next) break;
  }

  return jobs;
}

function getOnBoardCountries(attr) {
  if (Array.isArray(attr.countries)) {
    return attr.countries.filter(Boolean).map(String);
  }
  if (typeof attr.countries === "string" && attr.countries.trim()) {
    return [attr.countries.trim()];
  }
  return [];
}

async function fetchGetOnBoard() {
  const source = config.sources.getonboard;
  if (!source.enabled) return [];

  const jobs = [];
  const seen = new Set();

  for (const category of source.categories ?? ["programming"]) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category)) {
      throw new Error("Invalid Get on Board category: " + category);
    }

    for (let page = 1; page <= (source.pages ?? 1); page += 1) {
      const url = new URL(source.base_url + "/" + category + "/jobs");
      url.searchParams.set("per_page", String(source.per_page ?? 100));
      url.searchParams.append("expand[]", "company");
      url.searchParams.set("page", String(page));

      const payload = await fetchJson(url, { retries: 4, timeoutMs: 60_000 });
      if (page < (source.pages ?? 1)) await sleep(350);
      if (!Array.isArray(payload.data)) {
        throw new Error("Unexpected Get on Board response for " + category + " page " + page);
      }

      for (const item of payload.data) {
        const attr = item?.attributes ?? {};
        const publicUrl = item?.links?.public_url;
        const title = typeof attr.title === "string" ? attr.title.trim() : "";
        if (!title || typeof publicUrl !== "string" || !publicUrl.startsWith("https://www.getonbrd.com/")) continue;
        if (seen.has(publicUrl)) continue;
        seen.add(publicUrl);

        const countries = getOnBoardCountries(attr);
        const company = attr.company?.data?.attributes?.name ?? "Get on Board";
        const remote = attr.remote === true;
        const location = remote
          ? "Remote" + (countries.length ? " — " + countries.join(", ") : "")
          : countries.join(", ") || String(attr.location ?? "");

        jobs.push({
          id: stableId("getonboard", item.id, publicUrl),
          source: "Get on Board",
          source_trust: source.trust,
          external_id: String(item.id ?? ""),
          url: publicUrl.trim(),
          title,
          company: String(company),
          location,
          remote,
          workplace: remote ? "remote" : "onsite-or-hybrid",
          employment_type: normalizeEmployment(attr.modality ?? attr.employment_type ?? attr.job_type ?? ""),
          published_at: parseDate(attr.published_at),
          salary: String(attr.salary ?? attr.compensation ?? ""),
          tags: [category],
          description: stripHtml(attr.description ?? attr.summary ?? "").slice(0, 1600)
        });
      }

      if (payload.data.length < (source.per_page ?? 100)) break;
    }
  }

  return jobs;
}

async function fetchRemoteOk() {
  const source = config.sources.remoteok;
  if (!source?.enabled) return [];

  const payload = await fetchJson(source.endpoint, { retries: 4 });
  const rows = Array.isArray(payload) ? payload.filter(item => item?.id && item?.position) : [];

  return rows.slice(0, source.limit ?? 120).map(job => {
    const listingUrl = String(job.url ?? job.apply_url ?? "").trim();
    const location = [job.location, job.country].filter(Boolean).join(", ") || "Remote";
    const salary = job.salary_min || job.salary_max
      ? [job.salary_min, job.salary_max].filter(Boolean).join(" - ")
      : String(job.salary ?? "");

    return {
      id: stableId("remoteok", job.id, listingUrl),
      source: "RemoteOK",
      source_trust: source.trust,
      external_id: String(job.id ?? ""),
      url: listingUrl,
      apply_url: String(job.apply_url ?? listingUrl),
      title: job.position ?? "",
      company: job.company ?? "",
      location,
      remote: true,
      workplace: "remote",
      employment_type: normalizeEmployment(job.employment_type ?? ""),
      published_at: parseDate(job.date ?? job.epoch),
      salary,
      tags: Array.isArray(job.tags) ? job.tags : [],
      description: stripHtml(job.description).slice(0, 1600)
    };
  });
}

async function fetchJobicy() {
  const source = config.sources.jobicy;
  if (!source?.enabled) return [];

  const url = new URL(source.endpoint);
  url.searchParams.set("count", String(source.count ?? 60));
  if (source.geo) url.searchParams.set("geo", source.geo);

  const payload = await fetchJson(url.toString(), { retries: 4 });
  const jobs = [];

  for (const job of payload.jobs ?? []) {
    const listingUrl = String(job.url ?? "").trim();
    if (!listingUrl.startsWith("https://")) continue;

    const salaryParts = [job.salaryMin, job.salaryMax].filter(v => v !== null && v !== undefined && v !== "");
    const salary = salaryParts.length
      ? salaryParts.join(" - ") + (job.salaryCurrency ? " " + job.salaryCurrency : "") + (job.salaryPeriod ? " / " + job.salaryPeriod : "")
      : "";

    jobs.push({
      id: stableId("jobicy", job.id, listingUrl),
      source: "Jobicy",
      source_trust: source.trust,
      external_id: String(job.id ?? ""),
      url: listingUrl,
      apply_url: listingUrl,
      title: job.jobTitle ?? "",
      company: job.companyName ?? "",
      location: job.jobGeo ? String(job.jobGeo) : "Remote",
      remote: true,
      workplace: "remote",
      employment_type: normalizeEmployment(job.jobType?.[0] ?? ""),
      published_at: parseDate(job.pubDate),
      salary,
      tags: [...(job.jobIndustry ?? []), job.jobLevel].filter(Boolean),
      description: stripHtml(job.jobDescription ?? job.jobExcerpt ?? "").slice(0, 1600)
    });
  }

  return jobs;
}

function dedupe(jobs) {
  const seen = new Map();
  for (const job of jobs) {
    const key = job.url?.replace(/\/$/, "").toLowerCase() || job.id;
    if (!seen.has(key)) seen.set(key, job);
  }
  return [...seen.values()];
}

function daysOld(iso) {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

function escapeMd(value = "") {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function topEligible(opportunities, predicate, scoreKey, limit) {
  const terminal = new Set(["applied", "replied", "interview", "won", "lost", "skipped"]);
  return opportunities
    .filter(job => predicate(job) && !terminal.has(job.status))
    .sort((a, b) => b[scoreKey] - a[scoreKey] || String(b.published_at).localeCompare(String(a.published_at)))
    .slice(0, limit);
}

function reasonFor(job, track) {
  const p = job.potential;
  if (p?.reasons?.length) {
    const positives = p.reasons.filter(r => r.startsWith("+")).slice(0, 2).map(r => r.slice(2));
    const summary = [
      "Fit " + p.current_fit + "%",
      "Potencial " + p.career_potential,
      "Transfer " + p.transferability
    ];
    if (positives.length) summary.push(positives.join("; "));
    return summary.join(" · ");
  }

  const pieces = [];
  if (job.matched_keywords?.length) pieces.push("perfil: " + job.matched_keywords.slice(0, 4).join(", "));
  if (track === "main" && job.main_signals?.length) pieces.push("main: " + job.main_signals.slice(0, 3).join(", "));
  if (track === "side" && job.side_signals?.length) pieces.push("side: " + job.side_signals.slice(0, 3).join(", "));
  if (job.access === "remote-now") pieces.push("remoto compatible");
  if (job.access === "local-onsite") pieces.push("presencial/híbrido en zona local");
  if (job.access === "remote-unclear") pieces.push("remoto, elegibilidad geográfica a verificar");
  return pieces.join("; ") || "revisión manual recomendada";
}

function buildTopTable(rows, track) {
  const scoreKey = track === "main" ? "main_score" : "side_score";
  const lines = [
    "| Rank | Fit | Potencial | Rol | Empresa | Modalidad / ubicación | Por qué aparece |",
    "| ---: | ---: | ---: | --- | --- | --- | --- |"
  ];

  for (const job of rows) {
    const fit = job.potential?.current_fit ?? "—";
    const potential = job.potential?.career_potential ?? "—";
    lines.push(
      "| " + job[scoreKey] +
      " | " + fit +
      " | " + potential +
      " | [" + escapeMd(job.title) + "](" + job.url + ")" +
      " | " + escapeMd(job.company) +
      " | " + escapeMd(job.workplace + " · " + (job.location || "sin ubicación")) +
      " | " + escapeMd(reasonFor(job, track)) + " |"
    );
  }

  if (!rows.length) lines.push("| — | — | — | Sin picks fuertes en esta corrida | — | — | — |");
  return lines;
}

function buildLatestReport(opportunities, topMain, topSide, sourceStats, generatedAt) {
  const relocation = opportunities
    .filter(job => job.relocation_watch)
    .sort((a, b) => b.main_score - a.main_score || (b.potential?.career_potential ?? 0) - (a.potential?.career_potential ?? 0))
    .slice(0, 5);

  const lines = [
    "# Port — Opportunity Radar",
    "",
    "Generado: " + generatedAt,
    "",
    "Modo de aplicación: **manual**. Port busca, filtra y prepara; Ian decide y aplica.",
    "",
    "Fuentes: " + Object.entries(sourceStats).map(([name, count]) => name + " (" + count + ")").join(", "),
    "",
    "## MAIN — Top picks",
    "",
    "Trabajo principal: full-time o part-time; remoto o presencial/híbrido si la ubicación es razonable.",
    "",
    ...buildTopTable(topMain, "main"),
    "",
    "## SIDE — Top picks",
    "",
    "Ingreso secundario: freelance, contrato, proyecto o part-time; **remoto obligatorio**.",
    "",
    ...buildTopTable(topSide, "side"),
    "",
    "## Relocation watch",
    ""
  ];

  if (relocation.length) {
    for (const job of relocation) {
      lines.push("- [" + escapeMd(job.title) + "](" + job.url + ") — " + escapeMd(job.company) + " · " + escapeMd(job.location) + " · MAIN " + job.main_score);
    }
  } else {
    lines.push("Sin candidatos de relocalización fuertes en esta corrida.");
  }

  lines.push(
    "",
    "## Cobertura",
    "",
    "- Universo curado guardado: **" + opportunities.length + "** oportunidades.",
    "- Top picks: máximo **" + config.tracks.main.top_picks + " MAIN** + **" + config.tracks.side.top_picks + " SIDE** por corrida.",
    "- Nada del universo curado se descarta silenciosamente: ver reports/all-candidates.md.",
    "- Para adaptar el CV sin inventar experiencia: ver reports/application-prep.md.",
    "",
    "## Confianza",
    "",
    "Las fuentes actuales entran por APIs públicas/oficiales. Eso valida el canal de obtención, no garantiza por sí solo que una empresa o vacante sea legítima.",
    "",
    "Cada oportunidad incluye `trust` en JSON: **source_trust**, **company_trust**, **listing_risk** (`low` / `unknown` / `medium` / `high`) y señales de advertencia. Riesgo alto penaliza el ranking; no oculta la vacante automáticamente.",
    ""
  );

  return lines.join("\n");
}

function buildAllCandidates(opportunities, generatedAt) {
  const rows = [...opportunities]
    .sort((a, b) => Math.max(b.main_score, b.side_score) - Math.max(a.main_score, a.side_score))
    .slice(0, config.retention.all_candidates_limit);

  const lines = [
    "# Port — All candidates",
    "",
    "Generado: " + generatedAt,
    "",
    "Este archivo conserva el universo curado para que una decisión automática no oculte una oportunidad que pueda interesarte por criterio personal.",
    "",
    "| MAIN | Fit | Potencial | Riesgo | SIDE | Rol | Empresa | Fuente | Estado |",
    "| ---: | ---: | ---: | --- | ---: | --- | --- | --- | --- |"
  ];

  for (const job of rows) {
    lines.push(
      "| " + job.main_score +
      " | " + (job.potential?.current_fit ?? "—") +
      " | " + (job.potential?.career_potential ?? "—") +
      " | " + escapeMd(job.trust?.listing_risk ?? "—") +
      " | " + job.side_score +
      " | [" + escapeMd(job.title) + "](" + job.url + ")" +
      " | " + escapeMd(job.company) +
      " | " + escapeMd(job.source) +
      " | " + escapeMd(job.status) + " |"
    );
  }

  return lines.join("\n") + "\n";
}

function requirementAnalysis(job) {
  const body = normalizedText(job.title, job.description, ...(job.tags ?? []));
  const required = matcherProfile.requirement_terms.filter(term => body.includes(term.toLowerCase()));
  const known = matcherProfile.known_skills;
  const emphasize = required.filter(term => known.some(skill => skill === term || skill.includes(term) || term.includes(skill)));
  const verify = required.filter(term => !emphasize.includes(term));
  return { emphasize: [...new Set(emphasize)], verify: [...new Set(verify)] };
}

function buildApplicationPrep(topMain, topSide, generatedAt) {
  const sections = [
    "# Port — Application prep",
    "",
    "Generado: " + generatedAt,
    "",
    "Borradores de preparación para los Top Picks. No aplica automáticamente y no agrega experiencia que no esté respaldada por el perfil.",
    ""
  ];

  for (const [track, jobs] of [["MAIN", topMain], ["SIDE", topSide]]) {
    sections.push("## " + track, "");

    if (!jobs.length) {
      sections.push("Sin picks para preparar en esta corrida.", "");
      continue;
    }

    for (const job of jobs) {
      const req = requirementAnalysis(job);
      const p = job.potential;
      sections.push(
        "### " + job.title + " — " + job.company,
        "",
        "- Oferta: " + job.url,
        "- Fuente: " + job.source + " · SOURCE TRUST: " + (job.trust?.source_trust ?? job.source_trust),
        "- COMPANY TRUST: " + (job.trust?.company_trust ?? "—") + " · LISTING RISK: **" + (job.trust?.listing_risk ?? "—") + "**",
        "- Señales trust: " + (job.trust?.warnings?.length ? job.trust.warnings.join(", ") : "ninguna"),
        "- Modalidad: " + job.workplace + " · " + (job.location || "sin ubicación"),
        "- Tipo detectado: " + job.employment_type,
        "- Current Fit: **" + (p?.current_fit ?? "—") + "** · Transferability: **" + (p?.transferability ?? "—") + "** · Gap Cost: **" + (p?.gap_cost ?? "—") + "**",
        "- Career Potential: **" + (p?.career_potential ?? "—") + "** · Evidence: **" + (p?.evidence_confidence ?? "—") + "**",
        "- Enfatizar en CV/intro: " + (req.emphasize.length ? req.emphasize.join(", ") : "experiencia relevante del perfil general; revisar manualmente"),
        "- Verificar antes de afirmar: " + (req.verify.length ? req.verify.join(", ") : "sin gaps obvios detectados por palabras clave"),
        "- Por qué apareció: " + (p?.reasons?.filter(r => r.startsWith("+")).slice(0, 4).join("; ") || "revisión manual"),
        "- Gaps: " + (p?.gaps?.length ? p.gaps.map(g => g.term + " (" + g.type + ")").join(", ") : "ninguno destacado"),
        "- Regla: no inventar años, tecnologías ni resultados que no estén documentados.",
        ""
      );
    }
  }

  return sections.join("\n");
}

let existing = { version: 3, opportunities: [] };
try {
  existing = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
} catch {
  // First run.
}

const priorById = new Map((existing.opportunities ?? []).map(job => [job.id, job]));
const generatedAt = new Date().toISOString();

const sourcePipeline = [
  { name: "Remotive", fetch: fetchRemotive },
  { name: "Arbeitnow", fetch: fetchArbeitnow },
  { name: "Get on Board", fetch: fetchGetOnBoard },
  { name: "RemoteOK", fetch: fetchRemoteOk },
  { name: "Jobicy", fetch: fetchJobicy }
];

const sourceResults = await Promise.allSettled(sourcePipeline.map(entry => entry.fetch()));
const sourceNames = sourcePipeline.map(entry => entry.name);
const fetched = [];
const sourceStats = {};
const failures = [];

sourceResults.forEach((result, index) => {
  const name = sourceNames[index];
  if (result.status === "fulfilled") {
    sourceStats[name] = result.value.length;
    fetched.push(...result.value);
  } else {
    sourceStats[name] = 0;
    failures.push(name + ": " + String(result.reason));
  }
});

if (!fetched.length && failures.length === sourceResults.length) {
  throw new Error("All sources failed: " + failures.join(" | "));
}

const protectedStatuses = new Set([
  "shortlisted",
  "applied",
  "replied",
  "interview",
  "won",
  "lost",
  "skipped"
]);

const opportunities = dedupe(fetched)
  .map(job => {
    const legacy = scoreOpportunity(job);
    const potential = evaluatePotential(job, {
      careerModel,
      matcherProfile,
      config,
      access: legacy.access,
      legacy
    });
    const prior = priorById.get(job.id);
    const scored = {
      ...job,
      ...legacy,
      main_score: potential.main_rank,
      side_score: potential.side_rank,
      main_eligible_now: potential.main_eligible,
      side_eligible: potential.side_eligible,
      relocation_watch: legacy.relocation_watch || potential.relocation_watch,
      potential,
      status: prior?.status ?? "new",
      notes: prior?.notes ?? "",
      first_seen: prior?.first_seen ?? generatedAt,
      last_seen: generatedAt
    };
    return applyTrustToOpportunity(scored);
  })
  .filter(job => !job.published_at || daysOld(job.published_at) <= config.retention.max_age_days)
  .filter(job => job.potential?.retain);

for (const prior of priorById.values()) {
  if (protectedStatuses.has(prior.status) && !opportunities.some(job => job.id === prior.id)) {
    opportunities.push(prior);
  }
}

markDuplicateClusters(opportunities);

opportunities.sort((a, b) => Math.max(b.main_score ?? 0, b.side_score ?? 0) - Math.max(a.main_score ?? 0, a.side_score ?? 0));
opportunities.splice(config.retention.max_opportunities);

const topMain = topEligible(
  opportunities,
  job => job.main_eligible_now,
  "main_score",
  config.tracks.main.top_picks
);

const topSide = topEligible(
  opportunities,
  job => job.side_eligible,
  "side_score",
  config.tracks.side.top_picks
);

await fs.mkdir("reports", { recursive: true });

await fs.writeFile(
  DATA_PATH,
  JSON.stringify({
    version: 4,
    matcher: "potential-v1",
    trust_layer: "listing-v1",
    generated_at: generatedAt,
    career_model_version: careerModel.github_evidence?.version ?? 1,
    application_mode: config.application.mode,
    source_failures: failures,
    source_stats: sourceStats,
    top_picks: {
      main: topMain.map(job => job.id),
      side: topSide.map(job => job.id)
    },
    opportunities
  }, null, 2) + "\n"
);

await fs.writeFile(REPORT_PATH, buildLatestReport(opportunities, topMain, topSide, sourceStats, generatedAt) + "\n");
await fs.writeFile(ALL_PATH, buildAllCandidates(opportunities, generatedAt));
await fs.writeFile(PREP_PATH, buildApplicationPrep(topMain, topSide, generatedAt) + "\n");

console.log(
  "Radar potential-v1: " + fetched.length + " fetched, " + opportunities.length +
  " retained, " + topMain.length + " MAIN picks, " + topSide.length +
  " SIDE picks, " + failures.length + " source failures."
);
