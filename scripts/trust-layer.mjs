const BOARD_HOSTS = {
  Remotive: ["remotive.com"],
  Arbeitnow: ["arbeitnow.com"],
  "Get on Board": ["getonbrd.com"],
  RemoteOK: ["remoteok.com"],
  Jobicy: ["jobicy.com"]
};

const ATS_HOST_FRAGMENTS = [
  "jobs.lever.co",
  "boards.greenhouse.io",
  "jobs.ashbyhq.com",
  "myworkdayjobs.com",
  "careers.",
  "apply.workable.com",
  "breezy.hr"
];

const SCAM_PATTERNS = [
  "wire transfer",
  "registration fee",
  "pay a fee",
  "upfront payment",
  "buy your own equipment",
  "telegram only",
  "whatsapp only",
  "guaranteed income",
  "no experience needed earn",
  "crypto wallet"
];

const GAMBLING_PATTERNS = ["casino", "betting", "sportsbook", "igaming"];

function normalizedText(...parts) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function safeHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function hostMatchesBoard(hostname, source) {
  const allowed = BOARD_HOSTS[source] ?? [];
  return allowed.some(fragment => hostname === fragment || hostname.endsWith("." + fragment));
}

function isAtsOrCareerUrl(url) {
  const host = safeHostname(url);
  if (!host) return false;
  return ATS_HOST_FRAGMENTS.some(fragment => host.includes(fragment.replace(/^\./, "")));
}

function salaryLooksUnrealistic(salaryText) {
  const text = String(salaryText).toLowerCase();
  const numbers = (text.match(/\d[\d,]*/g) ?? []).map(n => Number(n.replace(/,/g, ""))).filter(n => n > 0);
  if (!numbers.length) return false;
  const max = Math.max(...numbers);
  if (text.includes("hour") || text.includes("/hr")) return max > 500;
  if (text.includes("year") || text.includes("annual") || text.includes("yr")) return max > 800_000;
  if (text.includes("month")) return max > 80_000;
  return max > 2_000_000;
}

/**
 * Listing / company trust heuristics. Source API legitimacy ≠ vacancy legitimacy.
 */
export function assessListingTrust(job) {
  const trust = {
    source_trust: job.source_trust ?? "unknown",
    company_trust: "medium",
    listing_risk: "unknown",
    signals: [],
    warnings: []
  };

  const body = normalizedText(job.title, job.description, job.company, job.salary);
  const listingHost = safeHostname(job.url);
  const applyHost = safeHostname(job.apply_url ?? job.url);

  if (hostMatchesBoard(listingHost, job.source)) {
    trust.signals.push("listing_on_official_board");
  } else if (listingHost) {
    trust.warnings.push("listing_url_off_board");
  }

  if (isAtsOrCareerUrl(job.apply_url ?? job.url)) {
    trust.signals.push("apply_url_ats_or_careers");
    trust.company_trust = "medium";
  } else if (applyHost && !hostMatchesBoard(applyHost, job.source)) {
    trust.warnings.push("apply_url_external");
  }

  if (!job.company || String(job.company).trim().length < 2) {
    trust.company_trust = "low";
    trust.warnings.push("missing_company_name");
  } else if (trust.signals.includes("apply_url_ats_or_careers")) {
    trust.company_trust = "medium";
  }

  if ((job.description?.length ?? 0) < 100) {
    trust.warnings.push("short_description");
  }

  if (salaryLooksUnrealistic(job.salary)) {
    trust.warnings.push("salary_outlier");
  }

  for (const pattern of SCAM_PATTERNS) {
    if (body.includes(pattern)) {
      trust.warnings.push("scam_pattern");
      trust.listing_risk = "high";
      break;
    }
  }

  for (const pattern of GAMBLING_PATTERNS) {
    if (body.includes(pattern)) {
      trust.warnings.push("gambling_industry");
      trust.listing_risk = "high";
      break;
    }
  }

  if (trust.listing_risk !== "high") {
    if (trust.warnings.length >= 3) trust.listing_risk = "medium";
    else if (trust.warnings.length > 0) trust.listing_risk = "unknown";
    else trust.listing_risk = "low";
  }

  return trust;
}

export function applyTrustToOpportunity(opportunity) {
  const trust = assessListingTrust(opportunity);
  opportunity.trust = trust;

  if (!opportunity.potential) return opportunity;

  if (trust.listing_risk === "high") {
    opportunity.potential.workstyle_fit = Math.max(0, (opportunity.potential.workstyle_fit ?? 50) - 40);
    opportunity.potential.main_rank = Math.max(0, (opportunity.potential.main_rank ?? opportunity.main_score ?? 0) - 25);
    opportunity.potential.side_rank = Math.max(0, (opportunity.potential.side_rank ?? opportunity.side_score ?? 0) - 25);
    opportunity.main_score = opportunity.potential.main_rank;
    opportunity.side_score = opportunity.potential.side_rank;
  } else if (trust.listing_risk === "medium") {
    opportunity.potential.workstyle_fit = Math.max(0, (opportunity.potential.workstyle_fit ?? 50) - 12);
  }

  return opportunity;
}

export function markDuplicateClusters(opportunities) {
  const clusters = new Map();
  for (const job of opportunities) {
    const key = normalizedText(job.company, job.title).replace(/\s+/g, " ").trim();
    if (!key) continue;
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(job);
  }

  for (const [, jobs] of clusters) {
    if (jobs.length < 2) continue;
    for (const job of jobs) {
      if (!job.trust) job.trust = assessListingTrust(job);
      if (!job.trust.warnings.includes("duplicate_listing_cluster")) {
        job.trust.warnings.push("duplicate_listing_cluster");
      }
      if (job.trust.listing_risk === "low") job.trust.listing_risk = "unknown";
    }
  }
}
