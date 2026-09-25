import fs from "node:fs/promises";
import path from "node:path";

const CAREER_DIR = "career";

const FILE_NAMES = [
  "github-evidence.json",
  "employment-evidence.json",
  "education.json",
  "certifications.json",
  "self-assessment.json",
  "preferences.json",
  "constraints.json",
  "career-paths.json"
];

const GAP_WATCH_TERMS = [
  "make.com", "n8n", ".net", "c#", "aws", "azure", "gcp", "kubernetes", "terraform",
  "graphql", "salesforce", "hubspot", "seo", "analytics", "llm", "sap", "abap",
  "databricks", "airflow", "dbt", "kafka", "spark"
];

function uniqueLower(values) {
  return [...new Set(values.map(v => String(v).toLowerCase()).filter(Boolean))];
}

function collectMatchTerms(capabilities) {
  const terms = [];
  for (const cap of capabilities) {
    if (cap.skill) terms.push(cap.skill);
    if (Array.isArray(cap.match_terms)) terms.push(...cap.match_terms);
    if (Array.isArray(cap.aliases)) terms.push(...cap.aliases);
  }
  return uniqueLower(terms);
}

function buildKnownSkills(capabilities, employment) {
  const fromGithub = capabilities
    .filter(cap => ["direct", "transferable"].includes(cap.type))
    .filter(cap => ["strong", "moderate", "core"].includes(cap.evidence_strength))
    .flatMap(cap => [cap.skill, ...(cap.match_terms ?? []), ...(cap.aliases ?? [])]);

  const fromWork = (employment.entries ?? [])
    .filter(entry => entry.include_in_matcher)
    .flatMap(entry => entry.match_terms ?? [entry.area].filter(Boolean));

  return uniqueLower([...fromGithub, ...fromWork]);
}

function buildRequirementTerms(knownSkills, capabilities) {
  return uniqueLower([
    ...collectMatchTerms(capabilities),
    ...knownSkills,
    ...GAP_WATCH_TERMS
  ]);
}

/**
 * Loads the structured career model from career/*.json (canonical source for the matcher).
 */
export async function loadCareerModel(baseDir = ".") {
  const root = path.join(baseDir, CAREER_DIR);
  const model = { version: 1 };

  for (const name of FILE_NAMES) {
    const filePath = path.join(root, name);
    const key = name.replace(/\.json$/, "").replace(/-/g, "_");
    const payload = JSON.parse(await fs.readFile(filePath, "utf8"));
    model[key] = payload;
  }

  const capabilities = model.github_evidence?.capabilities ?? [];
  const employment = model.employment_evidence ?? { entries: [] };
  const known_skills = buildKnownSkills(capabilities, employment);
  const requirement_terms = buildRequirementTerms(known_skills, capabilities);

  model.matcher_profile = {
    known_skills,
    requirement_terms,
    positioning: model.self_assessment?.positioning ?? model.employment_evidence?.positioning ?? ""
  };

  return model;
}
