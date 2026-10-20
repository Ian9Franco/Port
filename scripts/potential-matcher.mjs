import { confirmedSideNature } from "./employment.mjs";
import { commuteBurden, commuteNote, placeText, relocationScore, salaryComparisonNote, spainOrValencia } from "./geography.mjs";
import { termMatches } from "./text-match.mjs";

const CONFIDENCE_SCORE = { low: 45, medium: 68, high: 85, unknown: 50 };

const NON_EVIDENCE_TOKENS = new Set(["ai", "api", "build", "bi", "rest", "sql", "java"]);

const GAP_CLASSIFIERS = [
  { type: "operational", patterns: ["on-call", "on call", "24/7", "incident response", "pager", "production on-call"] },
  { type: "fundamental", patterns: ["10+ years", "15+ years", "8+ years", "abap", "sap functional", "sap fico", "sap basis", "successfactors", "sap hcm"] },
  { type: "ecosystem", patterns: ["sap", "s/4hana", "salesforce", "servicenow", "dynamics 365", "workday"] },
  { type: "tool", patterns: ["terraform", "kubernetes", "k8s", "aws", "azure", "gcp", "ansible", "databricks", "snowflake", "airflow", "dbt", "kafka", "spark", "n8n"] }
];

const ROLE_FAMILY_PATTERNS = [
  { id: "devops", patterns: ["devops", "site reliability", "platform engineer", "ci/cd"] },
  { id: "cloud", patterns: ["cloud engineer", "cloud architect", "google cloud"] },
  { id: "data", patterns: ["data engineer", "analytics engineer", "data analyst", "warehouse"] },
  { id: "sap", patterns: ["sap", "sap btp", "abap", "integration suite", "s/4hana"] },
  { id: "security", patterns: ["appsec", "application security", "cybersecurity", "security engineer", "pentest"] },
  { id: "automation", patterns: ["automation engineer", "integration engineer", "workflow automation"] },
  { id: "full_stack", patterns: ["full stack", "full-stack", "fullstack", "backend engineer", "backend developer", "frontend engineer", "product engineer"] },
  { id: "applied_ai", patterns: ["ai engineer", "ml engineer", "llm", "machine learning", "applied ai"] },
  { id: "growth", patterns: ["growth engineer", "revops", "marketing automation"] }
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

const FAMILY_BRIDGE = {
  devops: "DevOps transition base",
  cloud: "DevOps transition base",
  sap: "SAP technical transition",
  data: "Data analytics engineering",
  security: "Security-aware application engineering"
};

const ASSESSMENT_KEYS = {
  "TypeScript": ["typescript"],
  "PostgreSQL": ["sql", "postgresql"],
  "Supabase": ["supabase"],
  "Python backend": ["python", "fastapi"],
  "Java Spring Boot": ["java", "spring"],
  "Docker": ["docker"],
  "GitHub Actions": ["github actions"],
  "MongoDB": ["mongodb"],
  "Applied AI integration": ["ai tooling"]
};

const SENIORITY_LEVELS = [
  { label: "director", pattern: /\bdirectors?\b/i, penalty: 28 },
  { label: "head", pattern: /\bhead\b/i, penalty: 26 },
  { label: "principal", pattern: /\bprincipal\b/i, penalty: 24 },
  { label: "staff", pattern: /\bstaff\b/i, penalty: 22 },
  { label: "lead", pattern: /\blead\b/i, penalty: 18 },
  { label: "senior", pattern: /\b(senior|sr\.?)\b/i, penalty: 16 }
];

const REPETITIVE_PATTERNS = ["data entry", "ticket queue", "wordpress maintenance", "paid media", "call center"];

const GAP_LABEL = {
  tool: "herramienta",
  ecosystem: "ecosistema",
  operational: "operativo",
  fundamental: "fundamental",
  unknown: "desconocido"
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizedText(...parts) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function uniqueTerms(values) {
  return [...new Set(values.map(value => String(value).toLowerCase()).filter(Boolean))];
}

function capabilityTerms(cap) {
  return uniqueTerms([cap.skill, ...(cap.match_terms ?? []), ...(cap.aliases ?? [])])
    .filter(term => !NON_EVIDENCE_TOKENS.has(term));
}

function capabilityIndex(capabilities) {
  const byTerm = new Map();
  for (const cap of capabilities) {
    for (const term of capabilityTerms(cap)) {
      if (!byTerm.has(term)) byTerm.set(term, cap);
    }
  }
  return byTerm;
}

function findCapability(term, byTerm) {
  return byTerm.get(term) ?? null;
}

function textHas(text, pattern) {
  return termMatches(text, pattern);
}

function detectRoleFamilies(titleText, bodyText) {
  const hits = [];
  for (const family of ROLE_FAMILY_PATTERNS) {
    if (family.patterns.some(pattern => textHas(titleText, pattern) || textHas(bodyText, pattern))) {
      hits.push(family.id);
    }
  }
  return [...new Set(hits)];
}

function classifyGap(term) {
  for (const rule of GAP_CLASSIFIERS) {
    if (rule.patterns.some(pattern => textHas(term, pattern) || textHas(pattern, term))) return rule.type;
  }
  return "tool";
}

function extractRequirementTerms(bodyText, requirementTerms) {
  const found = requirementTerms.filter(term => !NON_EVIDENCE_TOKENS.has(term) && textHas(bodyText, term));
  return [...new Set(found)];
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

function gapPenalty(gaps) {
  const concrete = gaps.filter(gap => gap.type !== "unknown");
  if (!concrete.length) return 0;
  let penalty = 0;
  for (const gap of concrete) {
    if (gap.type === "tool") penalty += 8;
    if (gap.type === "ecosystem") penalty += 14;
    if (gap.type === "operational") penalty += 22;
    if (gap.type === "fundamental") penalty += 35;
  }
  return penalty / concrete.length;
}

function uncalibrated(cap, assessment) {
  const rows = (assessment?.technology_confidence ?? []).filter(row => row.status === "to_verify");
  const keys = ASSESSMENT_KEYS[cap.skill] ?? [];
  return keys.some(key => rows.some(row => String(row.skill).toLowerCase().includes(key)));
}

function seniorityAsk(job, titleText) {
  const api = String(job.seniority ?? "").toLowerCase();
  const titleJunior = /\b(junior|jr\.?|entry|trainee)\b/i.test(titleText);
  const apiJunior = /\b(junior|entry)\b/i.test(api);
  if ((titleJunior || apiJunior) && !/\b(senior|staff|principal|director)\b/i.test(titleText)) return null;
  for (const level of SENIORITY_LEVELS) {
    if (level.pattern.test(titleText) || level.pattern.test(api)) return level;
  }
  if (/\bmanager\b/i.test(api)) return { label: "manager", penalty: 18 };
  return null;
}

function workEvidenceCaps(employment) {
  return (employment?.entries ?? [])
    .filter(entry => entry.include_in_matcher)
    .map(entry => ({
      skill: entry.area,
      match_terms: entry.match_terms ?? [],
      evidence_strength: "moderate",
      confidence: "medium",
      sources: [entry.source || "self-assessment"],
      type: "work",
      notes: entry.notes ?? ""
    }));
}

function careerPotentialScore(roleFamilies, capabilities) {
  let best = 45;
  for (const id of roleFamilies) best = Math.max(best, TRANSITION_POTENTIAL[id] ?? 50);
  for (const [family, skill] of Object.entries(FAMILY_BRIDGE)) {
    if (roleFamilies.includes(family) && capabilities.some(cap => cap.skill === skill)) {
      best = Math.max(best, TRANSITION_POTENTIAL[family] ?? best);
    }
  }
  return clamp(best);
}

function scoreWorkstyle(bodyText, constraints) {
  let score = 82;
  for (const signal of constraints?.deprioritize_role_signals ?? []) {
    const phrase = String(signal).replace(/_/g, " ");
    if (textHas(bodyText, phrase)) score -= 18;
  }
  for (const pattern of REPETITIVE_PATTERNS) {
    if (textHas(bodyText, pattern)) score -= 12;
  }
  if ((constraints?.industry_exclusions ?? []).some(item => textHas(bodyText, item))) score -= 40;
  return clamp(score);
}

function buildRankScore(dimensions, track) {
  const weights = track === "main"
    ? { current_fit: 0.22, transferability: 0.18, career_potential: 0.2, evidence_confidence: 0.12, relocation_value: 0.1, workstyle_fit: 0.08, gap_cost: 0.1 }
    : { current_fit: 0.2, transferability: 0.12, career_potential: 0.1, evidence_confidence: 0.1, relocation_value: 0.02, workstyle_fit: 0.18, gap_cost: 0.08 };
  const composite =
    dimensions.current_fit * weights.current_fit +
    dimensions.transferability * weights.transferability +
    dimensions.career_potential * weights.career_potential +
    dimensions.evidence_confidence_score * weights.evidence_confidence +
    dimensions.relocation_value * weights.relocation_value +
    dimensions.workstyle_fit * weights.workstyle_fit +
    dimensions.gap_cost_score * weights.gap_cost;
  return clamp(composite);
}

function sourceSuffix(cap, assessment) {
  const sources = (cap.sources ?? []).slice(0, 3).join(", ") || "sin fuente";
  const depth = uncalibrated(cap, assessment) || cap.confidence === "low"
    ? " · profundidad sin confirmar"
    : "";
  return " · fuentes: " + sources + depth;
}

/**
 * Potential Matcher — evidence, transferability, and explainable gaps.
 * Keyword scores do not grant eligibility or retention.
 */
export function evaluatePotential(job, context) {
  const { careerModel, matcherProfile, config, access } = context;
  const assessment = careerModel.self_assessment ?? {};
  const githubCaps = careerModel.github_evidence?.capabilities ?? [];
  const capabilities = [...githubCaps, ...workEvidenceCaps(careerModel.employment_evidence)];
  const constraints = careerModel.constraints ?? {};
  const byTerm = capabilityIndex(capabilities);
  const geo = config.geography;

  const titleText = normalizedText(job.title, job.seniority);
  const bodyText = normalizedText(job.title, job.seniority, job.description, ...(job.tags ?? []));
  const requirementTerms = (matcherProfile.requirement_terms ?? []).map(term => term.toLowerCase());
  const knownSkills = new Set((matcherProfile.known_skills ?? []).map(skill => skill.toLowerCase()));

  const roleFamilies = detectRoleFamilies(titleText, bodyText);
  const mentioned = extractRequirementTerms(bodyText, requirementTerms);
  const direct = [];
  const transferable = [];
  const gaps = [];
  const reasons = [];
  let confidenceTotal = 0;
  let confidenceCount = 0;
  let usedUncalibrated = false;

  for (const term of mentioned) {
    const weight = textHas(titleText, term) ? 1.35 : 1;
    const cap = findCapability(term, byTerm);

    if (cap && (cap.type === "direct" || cap.type === "work") && (knownSkills.has(term) || cap.type === "work")) {
      direct.push({ term, skill: cap.skill, weight, cap });
      const confidence = CONFIDENCE_SCORE[cap.confidence] ?? 50;
      confidenceTotal += confidence * weight;
      confidenceCount += weight;
      if (uncalibrated(cap, assessment) || cap.confidence === "low") usedUncalibrated = true;
      continue;
    }

    if (cap && (cap.type === "transferable" || cap.type === "inference")) {
      transferable.push({ term, skill: cap.skill, weight, cap });
      confidenceTotal += (CONFIDENCE_SCORE[cap.confidence] ?? 45) * 0.8 * weight;
      confidenceCount += weight * 0.8;
      continue;
    }

    if (!knownSkills.has(term)) {
      gaps.push({ term, type: classifyGap(term) });
    }
  }

  for (const pattern of GAP_CLASSIFIERS.find(rule => rule.type === "fundamental").patterns) {
    if (textHas(bodyText, pattern) && !gaps.some(gap => gap.term === pattern)) {
      gaps.push({ term: pattern, type: "fundamental" });
    }
  }

  const grouped = new Map();
  for (const item of [...direct, ...transferable]) {
    const key = item.cap.type + ":" + item.skill;
    if (!grouped.has(key)) grouped.set(key, { ...item, terms: [] });
    grouped.get(key).terms.push(item.term);
  }
  for (const item of grouped.values()) {
    const kind = item.cap.type === "work"
      ? "evidencia laboral"
      : item.cap.type === "direct"
        ? "evidencia directa"
        : "transferible";
    reasons.push("+ " + kind + ": " + item.skill + " (" + item.terms.slice(0, 4).join(", ") + ")" + sourceSuffix(item.cap, assessment));
  }

  const technicalDirect = direct.filter(item => item.cap.type === "direct");
  const distinctSkills = new Set(technicalDirect.map(item => item.skill)).size;
  const weightedDirect = technicalDirect.reduce((sum, item) => sum + item.weight, 0);
  const weightedTransfer = transferable.reduce((sum, item) => sum + item.weight, 0);
  const concreteGaps = gaps.filter(gap => gap.type !== "unknown");
  const denom = Math.max(1, weightedDirect + weightedTransfer + concreteGaps.length);

  let currentFit = clamp((weightedDirect / denom) * 100);
  let transferability = clamp(((weightedDirect * 0.8 + weightedTransfer) / denom) * 100);
  if (distinctSkills === 0) currentFit = Math.min(currentFit, 32);
  else if (distinctSkills === 1) currentFit = Math.min(currentFit, 58);
  else currentFit = Math.min(currentFit, 86);

  for (const family of roleFamilies) {
    const bridgeName = FAMILY_BRIDGE[family];
    if (bridgeName && capabilities.some(cap => cap.skill === bridgeName)) {
      transferability = clamp(transferability + 8);
    }
  }

  const readSomething = technicalDirect.length + transferable.length + concreteGaps.length > 0;
  const incomplete = job.description_truncated === true || !readSomething;
  if (!readSomething) {
    gaps.push({ term: "requisitos distinguibles no identificados en el texto leído", type: "unknown" });
    currentFit = Math.min(currentFit, 35);
    transferability = Math.min(transferability, 40);
  } else if (!concreteGaps.length) {
    gaps.push({ term: "no aparecieron gaps de la lista vigilada; puede haber requisitos que el vocabulario no nombra", type: "unknown" });
  }
  if (job.description_truncated === true) {
    gaps.push({ term: "descripción cortada: la lista de requisitos está incompleta", type: "unknown" });
  }

  const seniority = seniorityAsk(job, titleText);
  if (seniority) {
    currentFit = clamp(currentFit - seniority.penalty);
    reasons.push("- seniority: el aviso pide " + seniority.label + "; la evidencia es de proyecto o curso, no seniority profesional confirmado");
  }

  let gapCostScore = clamp(100 - gapPenalty(gaps));
  let gapCost = concreteGaps.length ? gapCostLabel(gapCostScore) : "unknown";
  if (incomplete && gapCost === "low") gapCost = "unknown";
  if (gapCost === "unknown") gapCostScore = Math.min(gapCostScore, 60);

  let evidenceScore = confidenceCount ? clamp(confidenceTotal / confidenceCount) : 40;
  if (usedUncalibrated) evidenceScore = Math.min(evidenceScore, 54);
  if (usedUncalibrated) reasons.push("- profundidad sin confirmar en tecnologías que la autoevaluación todavía no calibró");

  const places = placeText(job);
  const careerPotential = careerPotentialScore(roleFamilies, githubCaps);
  const relocationValue = relocationScore(places, access, geo);
  const compensationFit = 50;
  const workstyleFit = scoreWorkstyle(bodyText, constraints);
  const burden = commuteBurden(access);

  for (const gap of gaps.filter(item => item.type !== "unknown").slice(0, 5)) {
    reasons.push("- gap " + (GAP_LABEL[gap.type] ?? gap.type) + ": " + gap.term);
  }
  for (const gap of gaps.filter(item => item.type === "unknown").slice(0, 2)) {
    reasons.push("- gap desconocido: " + gap.term);
  }
  if (roleFamilies.length) reasons.push("familias: " + roleFamilies.join(", "));
  reasons.push(commuteNote(access, config));

  const dimensions = {
    current_fit: currentFit,
    transferability,
    gap_cost: gapCost,
    gap_cost_score: gapCostScore,
    evidence_confidence: evidenceConfidenceLabel(evidenceScore),
    evidence_confidence_score: evidenceScore,
    career_potential: careerPotential,
    relocation_value: relocationValue,
    compensation_fit: compensationFit,
    compensation_note: salaryComparisonNote(job, constraints),
    workstyle_fit: workstyleFit,
    commute_burden: burden,
    commute_note: commuteNote(access, config)
  };

  const mainRank = buildRankScore(dimensions, "main") - clamp(burden * 0.12);
  const sideRank = buildRankScore(dimensions, "side");
  const fundamental = concreteGaps.some(gap => gap.type === "fundamental");
  const learnable = concreteGaps.every(gap => gap.type === "tool" || gap.type === "ecosystem");
  const transitionFamilies = new Set(["devops", "cloud", "data", "sap", "security"]);
  const transitionDiscovery = roleFamilies.some(id => transitionFamilies.has(id));
  const usablePlace = ["remote-now", "remote-unclear", "local-onsite", "relocation-watch"].includes(access);

  const transitionFriendly =
    transferability >= 48 &&
    gapCost !== "high" &&
    !fundamental &&
    careerPotential >= 52 &&
    workstyleFit >= 45;

  const technicalEnough = distinctSkills >= 2 || (transitionFriendly && distinctSkills + transferable.length >= 2);

  const mainEligible =
    technicalEnough &&
    ["remote-now", "remote-unclear", "local-onsite"].includes(access) &&
    workstyleFit >= 40 &&
    (mainRank >= 52 || (transitionFriendly && currentFit >= 28));

  const sideEligible =
    technicalEnough &&
    job.remote === true &&
    ["remote-now", "remote-unclear"].includes(access) &&
    confirmedSideNature(job) &&
    workstyleFit >= 40 &&
    sideRank >= 48;

  const relocationWatch =
    access === "relocation-watch" &&
    spainOrValencia(places, geo) &&
    !fundamental &&
    roleFamilies.length > 0 &&
    workstyleFit >= 45 &&
    (mainRank >= 50 || transitionFriendly);

  const retain =
    usablePlace &&
    (
      mainEligible ||
      sideEligible ||
      relocationWatch ||
      (transitionDiscovery && transitionFriendly && learnable && (access === "remote-now" || access === "remote-unclear" || access === "local-onsite" || access === "relocation-watch"))
    );

  return {
    ...dimensions,
    role_families: roleFamilies,
    reasons: [...new Set(reasons)].slice(0, 14),
    gaps,
    main_rank: clamp(mainRank),
    side_rank: clamp(sideRank),
    main_eligible: mainEligible,
    side_eligible: sideEligible,
    relocation_watch: relocationWatch,
    retain
  };
}
