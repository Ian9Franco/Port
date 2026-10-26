import fs from "node:fs/promises";
import path from "node:path";
import { getRepoRoot } from "./repo";

export type CareerModel = {
  constraints: {
    industry_exclusions?: string[];
    compensation?: {
      main?: {
        minimum_monthly_baseline?: number;
        currency?: string;
        period?: string;
        gross_or_net?: string;
        notes?: string;
      };
    };
    home?: {
      label?: string;
      metro?: string;
      country?: string;
      municipality?: string | null;
      notes?: string;
    };
    relocation?: {
      timing?: string;
      immediate?: boolean;
      with_family?: boolean;
      family_location?: string;
      preferred_places?: string[];
      not_generic_eu?: boolean;
      move_window?: string;
      notes?: string;
    };
    modality?: {
      home_region?: string;
      municipality?: string | null;
      commute_rule?: string;
    };
    deprioritize_role_signals?: string[];
  };
  preferences: {
    selling_principle?: string;
    career_priorities_ordered?: string[];
    tracks?: {
      main?: { goal?: string };
      side?: { goal?: string };
    };
  };
  selfAssessment: {
    positioning?: string;
    authorship?: { interpretation?: string };
    technology_confidence?: { skill?: string; status?: string; self_rating?: string; notes?: string }[];
    english?: { self_rating?: string; eligible_for_english_jobs?: boolean; notes?: string };
    gap_tolerance?: { interpretation?: string };
    seniority_flexibility?: { willing_junior_reset_for_transition?: boolean; fields?: string[] };
  };
  employment: {
    positioning?: string;
    assets?: { portfolio_url?: string; github_url?: string; flagship_project?: string };
    entries?: {
      area?: string;
      type?: string;
      confidence?: string;
      source?: string;
      match_terms?: string[];
      notes?: string;
    }[];
  };
  education: {
    entries?: { program?: string; status?: string; confidence?: string; source?: string; notes?: string }[];
  };
  certifications: {
    entries?: { name?: string; status?: string; credential_url?: string; source?: string; notes?: string }[];
  };
  github: {
    source_rule?: string;
    capabilities?: {
      skill?: string;
      evidence_strength?: string;
      confidence?: string;
      sources?: string[];
      type?: string;
      last_seen?: string;
      notes?: string;
    }[];
    documented_gaps?: string[];
  };
  paths: {
    rule?: string;
  };
};

const FILES = [
  "constraints.json",
  "preferences.json",
  "self-assessment.json",
  "employment-evidence.json",
  "education.json",
  "certifications.json",
  "github-evidence.json",
  "career-paths.json"
] as const;

async function readable(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

export async function findCareerDir(): Promise<string> {
  const candidates = [
    path.join(getRepoRoot(), "career"),
    path.join(process.cwd(), "career"),
    path.join(process.cwd(), "..", "career")
  ];
  for (const dir of candidates) {
    if (await readable(path.join(dir, "constraints.json"))) return dir;
  }
  throw new Error("No se encontraron career/*.json");
}

async function readJson<T>(dir: string, name: string): Promise<T> {
  const raw = await fs.readFile(path.join(dir, name), "utf8");
  return JSON.parse(raw) as T;
}

export async function loadCareerModel(): Promise<CareerModel> {
  const dir = await findCareerDir();
  const [
    constraints,
    preferences,
    selfAssessment,
    employment,
    education,
    certifications,
    github,
    paths
  ] = await Promise.all(FILES.map(name => readJson<CareerModel[keyof CareerModel]>(dir, name)));

  return {
    constraints: constraints as CareerModel["constraints"],
    preferences: preferences as CareerModel["preferences"],
    selfAssessment: selfAssessment as CareerModel["selfAssessment"],
    employment: employment as CareerModel["employment"],
    education: education as CareerModel["education"],
    certifications: certifications as CareerModel["certifications"],
    github: github as CareerModel["github"],
    paths: paths as CareerModel["paths"]
  };
}
