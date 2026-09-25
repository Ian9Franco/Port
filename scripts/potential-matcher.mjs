const CONFIDENCE_SCORE = { low: 45, medium: 68, high: 85, unknown: 50 };
const STRENGTH_WEIGHT = { strong: 1, moderate: 0.75, moderate_strong: 0.85, foundational: 0.45, moderate_adjacent: 0.7, foundational_adjacent: 0.55, none_direct: 0.2, strong_adjacent: 0.75 };

const GAP_CLASSIFIERS = [
  { type: "operational", patterns: ["on-call", "on call", "24/7", "24x7", "incident response", "pager", "production on-call", "sla", "night shift"] },
  { type: "fundamental", patterns: ["10+ years", "15+ years", "8+ years", "abap", "sap functional", "cpa", "md ", "board certified"] },
  { type: "ecosystem", patterns: ["sap ", "s/4hana", "salesforce", "servicenow", "dynamics 365", "workday", "oracle fusion"] },
  { type: "tool", patterns: ["terraform", "kubernetes", "k8s", "aws", "azure", "gcp", "docker", "ansible", "pulumi", "datadog", "prometheus", "grafana", "databricks", "snowflake", "airflow", "dbt", "kafka", "spark", "make.com", "n8n", ".net", "c#"] }
];

const ROLE_FAMILY_PATTERNS = [
  { id: "devops", patterns: ["devops", "dev ops", "sre", "site reliability", "platform engineer", "build release", "ci/cd", "cicd"] },
  { id: "cloud", patterns: ["cloud engineer", "cloud architect", "aws", "azure", "gcp", "google cloud"] },
  { id: "data", patterns: ["data engineer", "analytics engineer", "data analyst", "etl", "warehouse", "bi engineer"] },
  { id: "sap", patterns: ["sap ", "sap btp", "abap", "integration suite", "s/4"] },
  { id: "security", patterns: ["appsec", "application security", "cybersecurity", "security engineer", "pentest", "soc analyst"] },
  { id: "automation", patterns: ["automation engineer", "integration engineer", "zapier", "workflow automation"] },
  { id: "full_stack", patterns: ["full stack", "full-stack", "fullstack", "backend engineer", "frontend engineer"] },
  { id: "applied_ai", patterns: ["ai engineer", "ml engineer", "llm", "machine learning", "applied ai"] },
  { id: "growth", patterns: ["growth engineer", "revops", "marketing automation", "gtm systems"] }
];

const TRANSITION_POTENTIAL = {
  devops: 72,
  cloud: 58,
  data: 65,
  sap: 52,
  security: 62,
  automation: 88,
  full_stack: 90,
  applied_ai: 82,
  growth: 86
};

const REPETITIVE_PATTERNS = ["data entry", "ticket queue", "repetitive", "copy paste", "wordpress maintenance", "paid media", "call center"];

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizedText(...parts) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function includesAny(text, patterns) {
  return patterns.some(pattern => text.includes(pattern.toLowerCase()));
}

function detectRoleFamilies(titleText, bodyText) {
  const combined = titleText + " " + bodyText;
  const hits = [];
  for (const family of ROLE_FAMILY_PATTERNS) {
    if (includesAny(combined, family.patterns)) hits.push(family.id);
  }
  return [...new Set(hits)];
}

function classifyGap(term) {
  const needle = term.toLowerCase();
  for (const rule of GAP_CLASSIFIERS) {
    if (rule.patterns.some(pattern => needle.includes(pattern) || pattern.includes(needle))) {
      return rule.type;
    }
  }
  return "tool";
}

function gapCostPenalty(gaps) {
  if (!gaps.length) return 0;
  let penalty = 0;
  for (const gap of gaps) {
    if (gap.type === "tool") penalty += 8;
    if (gap.type === "ecosystem") penalty += 14;
    if (gap.type === "operational") penalty += 22;
    if (gap.type === "fundamental") penalty += 35;
  }
  return penalty / gaps.length;
}

function gapCostLabel(score) {
  if (score >= 72) return "low";
  if (score >= 48) return "medium";
  return "high";
}

function evidenceConfidenceLabel(score) {
  if (score >= 75) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function capabilityIndex(capabilities) {
  const byTerm = new Map();
  for (const cap of capabilities) {
    const terms = uniqueTerms([cap.skill, ...(cap.match_terms ?? []), ...(cap.aliases ?? [])]);
    for (const term of terms) {
      if (!byTerm.has(term) || strengthRank(cap) > strengthRank(byTerm.get(term))) {
        byTerm.set(term, cap);
      }
    }
  }
  return byTerm;
}

function uniqueTerms(values) {
  return [...new Set(values.map(v => String(v).toLowerCase()).filter(Boolean))];
}

function strengthRank(cap) {
  const order = { strong: 4, moderate: 3, moderate_strong: 3, foundational: 2, moderate_adjacent: 2, foundational_adjacent: 1, none_direct: 0 };
  return order[cap.evidence_strength] ?? 1;
}

function findCapabilityForTerm(term, byTerm, capabilities) {
  if (byTerm.has(term)) return byTerm.get(term);
  for (const cap of capabilities) {
    const terms = uniqueTerms([cap.skill, ...(cap.match_terms ?? []), ...(cap.aliases ?? [])]);
    if (terms.some(t => t.includes(term) || term.includes(t))) return cap;
  }
  return null;
}

function extractRequirementTerms(bodyText, requirementTerms) {
  const found = requirementTerms.filter(term => bodyText.includes(term.toLowerCase()));
  const operational = GAP_CLASSIFIERS.find(g => g.type === "operational")?.patterns ?? [];
  for (const pattern of operational) {
    if (bodyText.includes(pattern) && !found.includes(pattern)) found.push(pattern);
  }
  return [...new Set(found)];
}

function scoreRelocation(bodyText, access, preferences) {
  let score = access === "relocation-watch" ? 70 : 25;
  if (includesAny(bodyText, ["relocation", "visa sponsorship", "sponsor", "spain", "europe", "eu ", "remote eu"])) {
    score += 20;
  }
  if (preferences?.career_priorities_ordered?.[0] === "relocation_emigration") score += 5;
  return clamp(score);
}

function scoreCommuteBurden(access, locationText) {
  if (access === "remote-now" || access === "remote-unclear") return 5;
  if (access === "relocation-watch") return 35;
  if (access === "local-onsite") return 18;
  if (includesAny(locationText, ["microcentro", "caba", "capital federal", "buenos aires"])) return 45;
  if (access === "nonlocal-onsite") return 72;
  return 40;
}

function scoreWorkstyle(bodyText, constraints, negativeMatched) {
  let score = 82;
  const deprioritize = constraints?.deprioritize_role_signals ?? [];
  for (const signal of deprioritize) {
    if (bodyText.includes(signal.replace(/_/g, " ")) || bodyText.includes(signal)) score -= 18;
  }
  for (const pattern of REPETITIVE_PATTERNS) {
    if (bodyText.includes(pattern)) score -= 12;
  }
  score -= Math.min(24, negativeMatched * 4);
  const exclusions = constraints?.industry_exclusions ?? [];
  if (includesAny(bodyText, exclusions)) score -= 40;
  return clamp(score);
}

function scoreCompensation(salaryText, constraints) {
  if (!salaryText || !String(salaryText).trim()) return 50;
  const digits = String(salaryText).replace(/[^\d]/g, "");
  if (!digits) return 52;
  return 55;
}

function careerPotentialScore(roleFamilies, capabilities) {
  let best = 45;
  for (const id of roleFamilies) {
    const base = TRANSITION_POTENTIAL[id] ?? 50;
    best = Math.max(best, base);
  }
  const devopsCap = capabilities.find(c => c.skill === "DevOps transition base");
  if (roleFamilies.includes("devops") && devopsCap) best = Math.max(best, 74);
  if (roleFamilies.includes("sap")) best = Math.max(best, 54);
  if (roleFamilies.includes("cloud")) best = Math.max(best, 58);
  if (roleFamilies.includes("data")) best = Math.max(best, 64);
  return clamp(best);
}

function buildRankScore(dimensions, track) {
  const w = track === "main"
    ? { current_fit: 0.22, transferability: 0.18, career_potential: 0.2, evidence_confidence: 0.12, relocation_value: 0.1, workstyle_fit: 0.08, gap_cost: 0.1 }
    : { current_fit: 0.2, transferability: 0.12, career_potential: 0.1, evidence_confidence: 0.1, relocation_value: 0.02, workstyle_fit: 0.18, gap_cost: 0.08 };

  const gapComponent = dimensions.gap_cost_score;
  const composite =
    dimensions.current_fit * w.current_fit +
    dimensions.transferability * w.transferability +
    dimensions.career_potential * w.career_potential +
    dimensions.evidence_confidence_score * w.evidence_confidence +
    dimensions.relocation_value * w.relocation_value +
    dimensions.workstyle_fit * w.workstyle_fit +
    gapComponent * w.gap_cost;

  return clamp(composite);
}

/**
 * Potential Matcher v1 — evidence, transferability, and explainable gaps.
 */
export function evaluatePotential(job, context) {
  const { careerModel, matcherProfile, config, access, legacy } = context;
  const capabilities = careerModel.github_evidence?.capabilities ?? [];
  const constraints = careerModel.constraints ?? {};
  const preferences = careerModel.preferences ?? {};
  const byTerm = capabilityIndex(capabilities);

  const titleText = normalizedText(job.title);
  const bodyText = normalizedText(job.title, job.description, ...(job.tags ?? []));
  const requirementTerms = matcherProfile.requirement_terms ?? [];
  const knownSkills = new Set((matcherProfile.known_skills ?? []).map(s => s.toLowerCase()));

  const roleFamilies = detectRoleFamilies(titleText, bodyText);
  const mentioned = extractRequirementTerms(bodyText, requirementTerms);

  const direct = [];
  const transferable = [];
  const gaps = [];
  const reasons = [];
  let confidenceTotal = 0;
  let confidenceCount = 0;

  for (const term of mentioned) {
    const inTitle = titleText.includes(term);
    const weight = inTitle ? 1.4 : 1;
    const cap = findCapabilityForTerm(term, byTerm, capabilities);

    if (cap && cap.type === "direct" && knownSkills.has(term)) {
      direct.push({ term, skill: cap.skill, weight });
      confidenceTotal += (CONFIDENCE_SCORE[cap.confidence] ?? 50) * weight;
      confidenceCount += weight;
      reasons.push("+ evidencia directa: " + cap.skill + " (" + term + ")");
      continue;
    }

    if (cap && (cap.type === "transferable" || cap.type === "inference")) {
      transferable.push({ term, skill: cap.skill, weight });
      confidenceTotal += (CONFIDENCE_SCORE[cap.confidence] ?? 45) * 0.85 * weight;
      confidenceCount += weight * 0.85;
      reasons.push("+ transferible: " + cap.skill + " → " + term);
      continue;
    }

    if (knownSkills.has(term) || cap?.type === "direct") {
      direct.push({ term, skill: cap?.skill ?? term, weight });
      confidenceTotal += 55 * weight;
      confidenceCount += weight;
      reasons.push("+ perfil: " + term);
      continue;
    }

    const gapType = classifyGap(term);
    gaps.push({ term, type: gapType });
  }

  const weightedDirect = direct.reduce((sum, item) => sum + item.weight, 0);
  const weightedTransfer = transferable.reduce((sum, item) => sum + item.weight, 0);
  const weightedGaps = gaps.length;
  const denom = Math.max(1, weightedDirect + weightedTransfer + weightedGaps);

  let currentFit = clamp((weightedDirect / denom) * 100 + Math.min(12, legacy?.matched_keywords?.length ?? 0));
  let transferability = clamp(((weightedDirect * 0.35 + weightedTransfer * 0.9) / denom) * 100);

  if (roleFamilies.some(id => ["devops", "cloud", "data", "sap", "security"].includes(id))) {
    const bridge = capabilities.find(c => c.skill === "DevOps transition base" || c.type === "transferable");
    if (bridge) transferability = clamp(transferability + 12);
  }

  const gapPenalty = gapCostPenalty(gaps);
  const gapCostScore = clamp(100 - gapPenalty);
  const gapCost = gapCostLabel(gapCostScore);

  const evidenceConfidence = confidenceCount
    ? clamp(confidenceTotal / confidenceCount)
    : clamp(50 + (legacy?.base_score ?? 0));

  const careerPotential = careerPotentialScore(roleFamilies, capabilities);
  const relocationValue = scoreRelocation(bodyText, access, preferences);
  const compensationFit = scoreCompensation(job.salary, constraints);
  const workstyleFit = scoreWorkstyle(bodyText, constraints, legacy?.negative_hits ?? 0);
  const commuteBurden = scoreCommuteBurden(access, normalizedText(job.location));

  for (const gap of gaps.slice(0, 6)) {
    reasons.push("- gap " + gap.type + ": " + gap.term);
  }

  if (roleFamilies.length) {
    reasons.push("familias: " + roleFamilies.join(", "));
  }

  const dimensions = {
    current_fit: currentFit,
    transferability,
    gap_cost: gapCost,
    gap_cost_score: gapCostScore,
    evidence_confidence: evidenceConfidenceLabel(evidenceConfidence),
    evidence_confidence_score: evidenceConfidence,
    career_potential: careerPotential,
    relocation_value: relocationValue,
    compensation_fit: compensationFit,
    workstyle_fit: workstyleFit,
    commute_burden: commuteBurden
  };

  const mainRank = buildRankScore(dimensions, "main") - clamp(commuteBurden * 0.15);
  const sideRank = buildRankScore(dimensions, "side");
  const legacyMain = legacy?.keyword_main_score ?? legacy?.main_score ?? 0;
  const legacySide = legacy?.keyword_side_score ?? legacy?.side_score ?? 0;

  const transitionFriendly =
    transferability >= 62 &&
    gapCost !== "high" &&
    careerPotential >= 52 &&
    workstyleFit >= 45;

  const mainEligible =
    ["remote-now", "remote-unclear", "local-onsite"].includes(access) &&
    workstyleFit >= 40 &&
    (mainRank >= 55 || (transitionFriendly && currentFit >= 32) || legacyMain >= config.tracks.main.minimum_score);

  const sideEligible =
    job.remote === true &&
    ["remote-now", "remote-unclear"].includes(access) &&
    job.employment_type !== "full_time" &&
    workstyleFit >= 40 &&
    (sideRank >= 52 || (legacy?.side_signals?.length > 0 && sideRank >= 45));

  const relocationWatch =
    access === "relocation-watch" &&
    (mainRank >= 50 || careerPotential >= 60);

  const transitionFamilies = new Set(["devops", "cloud", "data", "sap", "security"]);
  const transitionDiscovery = roleFamilies.some(id => transitionFamilies.has(id));

  const retain =
    relocationWatch ||
    legacyMain >= config.tracks.main.minimum_score ||
    legacySide >= config.tracks.side.minimum_score ||
    mainRank >= 62 ||
    (transitionDiscovery && transitionFriendly && careerPotential >= 58);

  return {
    ...dimensions,
    role_families: roleFamilies,
    reasons: [...new Set(reasons)].slice(0, 12),
    gaps,
    main_rank: clamp(mainRank),
    side_rank: clamp(sideRank),
    main_eligible: mainEligible,
    side_eligible: sideEligible,
    relocation_watch: relocationWatch,
    retain
  };
}
