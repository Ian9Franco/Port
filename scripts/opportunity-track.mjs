import fs from "node:fs/promises";
import {
  buildPipelineReport,
  loadTrackingConfig,
  transitionStatus
} from "./tracking.mjs";
import { recordFeedbackEvent } from "./feedback-loop.mjs";
import { compileShortlistedApplications } from "./compile-application.mjs";
import { loadCareerModel } from "./load-career-model.mjs";

const DATA_PATH = "data/opportunities.json";
const PIPELINE_REPORT = "reports/pipeline.md";

function parseArgs(argv) {
  const args = { flags: {} };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args.flags[key] = next;
        i += 1;
      } else {
        args.flags[key] = true;
      }
    } else {
      positional.push(token);
    }
  }
  args.positional = positional;
  return args;
}

async function loadDatabase() {
  return JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
}

async function saveDatabase(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
}

async function findOpportunity(data, id) {
  const job = (data.opportunities ?? []).find(row => row.id === id);
  if (!job) throw new Error("Opportunity not found: " + id);
  return job;
}

async function cmdStatus(positional, flags) {
  const [, id, status] = positional;
  if (!id || !status) {
    throw new Error("Usage: status <opportunity-id> <status> [--cv ...] [--contact ...] [--salary ...] [--note ...]");
  }

  const config = await loadTrackingConfig();
  const data = await loadDatabase();
  const job = await findOpportunity(data, id);
  const updated = transitionStatus(job, status, {
    at: new Date().toISOString(),
    cv_used: flags.cv,
    contact: flags.contact,
    salary_offered: flags.salary,
    feedback: flags.feedback,
    note: flags.note
  }, config);

  data.opportunities = data.opportunities.map(row => (row.id === id ? updated : row));
  await saveDatabase(data);

  if (["shortlisted", "prepared"].includes(status)) {
    const careerModel = await loadCareerModel();
    await compileShortlistedApplications([updated], {
      careerModel,
      matcherProfile: careerModel.matcher_profile,
      generatedAt: new Date().toISOString()
    });
  }

  console.log("Updated " + id + " → " + status);
}

async function cmdFeedback(positional, flags) {
  const [, id, signal] = positional;
  if (!id || !signal) {
    throw new Error("Usage: feedback <opportunity-id> <signal> [--note ...]");
  }

  const config = await loadTrackingConfig();
  const data = await loadDatabase();
  const job = await findOpportunity(data, id);
  const { suggested_status } = await recordFeedbackEvent({
    opportunity: job,
    signal,
    note: flags.note
  });

  const updated = transitionStatus(job, suggested_status, {
    at: new Date().toISOString(),
    note: flags.note,
    signal
  }, config);

  data.opportunities = data.opportunities.map(row => (row.id === id ? updated : row));
  await saveDatabase(data);

  console.log("Feedback '" + signal + "' recorded; status → " + suggested_status);
}

async function cmdReport() {
  const config = await loadTrackingConfig();
  const data = await loadDatabase();
  const generatedAt = new Date().toISOString();
  const report = buildPipelineReport(data.opportunities ?? [], config, generatedAt);
  await fs.mkdir("reports", { recursive: true });
  await fs.writeFile(PIPELINE_REPORT, report + "\n");
  console.log(report);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const command = positional[0];

  if (command === "status") await cmdStatus(positional, flags);
  else if (command === "feedback") await cmdFeedback(positional, flags);
  else if (command === "report") await cmdReport();
  else {
    console.error("Commands: status | feedback | report");
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
