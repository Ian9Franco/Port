import fs from "node:fs/promises";
import path from "node:path";
import { dispatchRadarWorkflow, readGithubJsonFile, writeGithubJsonFile } from "./github-api";
import { assertDataBackendConfigured, getDataBackend, getRepoRoot } from "./repo";

export type PortOpportunity = {
  id: string;
  title: string;
  company: string;
  url: string;
  source: string;
  status: string;
  notes?: string;
  main_score?: number;
  side_score?: number;
  location?: string;
  employment_type?: string;
  description?: string;
  potential?: {
    current_fit?: number;
    career_potential?: number;
    transferability?: number;
    gap_cost?: string;
    reasons?: string[];
    gaps?: { term: string; type: string }[];
    role_families?: string[];
  };
  trust?: {
    listing_risk?: string;
    company_trust?: string;
    source_trust?: string;
    warnings?: string[];
  };
  tracking?: Record<string, unknown>;
};

export type PortDatabase = {
  generated_at?: string;
  top_picks?: { main: string[]; side: string[] };
  opportunities: PortOpportunity[];
  source_stats?: Record<string, number>;
};

export async function loadPortDatabase(): Promise<PortDatabase> {
  assertDataBackendConfigured();
  if (getDataBackend() === "github") {
    const { data } = await readGithubJsonFile<PortDatabase>("data/opportunities.json");
    return data;
  }
  const file = path.join(getRepoRoot(), "data/opportunities.json");
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as PortDatabase;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      "Could not read data/opportunities.json at " + file + ". " + message +
      " On Vercel, set PORT_DATA_BACKEND=github and GITHUB_TOKEN."
    );
  }
}

async function savePortDatabaseLocal(data: PortDatabase) {
  const file = path.join(getRepoRoot(), "data/opportunities.json");
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n");
}

async function savePortDatabase(data: PortDatabase, commitMessage: string) {
  if (getDataBackend() === "github") {
    const current = await readGithubJsonFile<PortDatabase>("data/opportunities.json");
    await writeGithubJsonFile("data/opportunities.json", data, current.sha, commitMessage);
    return;
  }
  await savePortDatabaseLocal(data);
}

export async function updateOpportunityStatus(
  id: string,
  status: string,
  note?: string
): Promise<PortOpportunity> {
  const data = await loadPortDatabase();
  const job = data.opportunities.find(row => row.id === id);
  if (!job) throw new Error("Opportunity not found");

  const at = new Date().toISOString();
  const from = job.status ?? "new";
  job.status = status;
  if (note !== undefined) job.notes = note;

  const tracking = {
    cv_used: "",
    contact: "",
    salary_offered: "",
    feedback: "",
    applied_at: null as string | null,
    updated_at: at,
    history: [] as Array<Record<string, string | null>>,
    ...(job.tracking ?? {})
  };

  if (status === "applied" && !tracking.applied_at) tracking.applied_at = at;
  tracking.updated_at = at;
  tracking.history = [
    ...(Array.isArray(tracking.history) ? tracking.history : []),
    { at, from, to: status, note: note ?? "", signal: "ui" }
  ].slice(-40);

  job.tracking = tracking;
  await savePortDatabase(data, `chore(ui): ${id} → ${status}`);

  if (getDataBackend() === "local" && ["shortlisted", "prepared"].includes(status)) {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const exec = promisify(execFile);
    await exec("node", ["scripts/compile-application.mjs", id], {
      cwd: getRepoRoot(),
      timeout: 120_000
    });
  }

  return job;
}

export async function runRadarRefresh(): Promise<{ mode: string }> {
  if (getDataBackend() === "github") {
    await dispatchRadarWorkflow();
    return { mode: "github_actions" };
  }

  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const exec = promisify(execFile);
  const root = getRepoRoot();
  await exec("node", ["scripts/fetch-opportunities.mjs"], {
    cwd: root,
    timeout: 300_000,
    maxBuffer: 20 * 1024 * 1024
  });
  return { mode: "local_script" };
}

export function pickByIds(opportunities: PortOpportunity[], ids: string[]) {
  const map = new Map(opportunities.map(row => [row.id, row]));
  return ids.map(id => map.get(id)).filter(Boolean) as PortOpportunity[];
}
