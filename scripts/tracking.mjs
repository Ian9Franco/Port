import fs from "node:fs/promises";

const TRACKING_CONFIG_PATH = "config/tracking.json";

let cachedConfig;

export async function loadTrackingConfig() {
  if (!cachedConfig) {
    cachedConfig = JSON.parse(await fs.readFile(TRACKING_CONFIG_PATH, "utf8"));
  }
  return cachedConfig;
}

export function isValidStatus(status, config) {
  return (config.statuses ?? []).includes(status);
}

export function isTerminalStatus(status, config) {
  return (config.terminal_for_top_picks ?? []).includes(status);
}

export function isProtectedStatus(status, config) {
  return (config.protected_from_prune ?? []).includes(status);
}

export function createEmptyTracking(status = "new") {
  return {
    cv_used: "",
    contact: "",
    salary_offered: "",
    feedback: "",
    applied_at: null,
    updated_at: null,
    history: []
  };
}

export function appendHistory(tracking, entry) {
  const history = Array.isArray(tracking.history) ? [...tracking.history] : [];
  history.push(entry);
  return { ...tracking, history: history.slice(-40) };
}

/**
 * Merge user pipeline state from a prior opportunity record into the refreshed job row.
 */
export function mergeOpportunityState(prior, job, generatedAt) {
  const status = prior?.status ?? job.status ?? "new";
  const notes = prior?.notes ?? job.notes ?? "";
  const tracking = {
    ...createEmptyTracking(status),
    ...(prior?.tracking ?? {})
  };

  tracking.updated_at = generatedAt;

  if (status === "applied" && !tracking.applied_at && prior?.tracking?.applied_at) {
    tracking.applied_at = prior.tracking.applied_at;
  }

  return {
    ...job,
    status,
    notes,
    tracking,
    first_seen: prior?.first_seen ?? job.first_seen ?? generatedAt,
    last_seen: generatedAt
  };
}

export function transitionStatus(opportunity, newStatus, meta, config) {
  if (!isValidStatus(newStatus, config)) {
    throw new Error("Invalid status: " + newStatus);
  }

  const at = meta.at ?? new Date().toISOString();
  const from = opportunity.status ?? "new";
  const tracking = {
    ...createEmptyTracking(from),
    ...(opportunity.tracking ?? {})
  };

  if (meta.cv_used !== undefined) tracking.cv_used = meta.cv_used;
  if (meta.contact !== undefined) tracking.contact = meta.contact;
  if (meta.salary_offered !== undefined) tracking.salary_offered = meta.salary_offered;
  if (meta.feedback !== undefined) tracking.feedback = meta.feedback;
  if (newStatus === "applied" && !tracking.applied_at) tracking.applied_at = at;

  tracking.updated_at = at;
  tracking.history = appendHistory(tracking, {
    at,
    from,
    to: newStatus,
    note: meta.note ?? "",
    signal: meta.signal ?? null
  }).history;

  const notes = meta.note !== undefined ? meta.note : opportunity.notes;

  return {
    ...opportunity,
    status: newStatus,
    notes: notes ?? "",
    tracking
  };
}

export function buildPipelineSummary(opportunities, config) {
  const counts = {};
  for (const status of config.statuses ?? []) counts[status] = 0;

  for (const job of opportunities) {
    const status = job.status ?? "new";
    counts[status] = (counts[status] ?? 0) + 1;
  }

  const applied = opportunities.filter(job => ["applied", "replied", "interview", "offer", "won"].includes(job.status));
  const familyWins = {};
  const familyApps = {};
  const cvUsage = {};

  for (const job of applied) {
    const families = job.potential?.role_families ?? [];
    for (const family of families) {
      familyApps[family] = (familyApps[family] ?? 0) + 1;
      if (["replied", "interview", "offer", "won"].includes(job.status)) {
        familyWins[family] = (familyWins[family] ?? 0) + 1;
      }
    }
    const cv = job.tracking?.cv_used;
    if (cv) cvUsage[cv] = (cvUsage[cv] ?? 0) + 1;
  }

  const lost = counts.lost ?? 0;
  const replies = (counts.replied ?? 0) + (counts.interview ?? 0) + (counts.offer ?? 0) + (counts.won ?? 0);

  return {
    counts,
    applied_total: counts.applied ?? 0,
    active_pipeline: (counts.reviewing ?? 0) + (counts.shortlisted ?? 0) + (counts.prepared ?? 0),
    reply_or_beyond: replies,
    lost_total: lost,
    family_applications: familyApps,
    family_positive_outcomes: familyWins,
    cv_used_counts: cvUsage
  };
}

export function buildPipelineReport(opportunities, config, generatedAt) {
  const summary = buildPipelineSummary(opportunities, config);
  const lines = [
    "# Port — Pipeline tracking",
    "",
    "Generado: " + generatedAt,
    "",
    "## Por estado",
    "",
    "| Estado | Cantidad |",
    "| --- | ---: |"
  ];

  for (const status of config.statuses ?? []) {
    lines.push("| " + status + " | " + (summary.counts[status] ?? 0) + " |");
  }

  lines.push(
    "",
    "## Métricas",
    "",
    "- Aplicaciones registradas (`applied`): **" + summary.applied_total + "**",
    "- En pipeline activo (reviewing / shortlisted / prepared): **" + summary.active_pipeline + "**",
    "- Respuesta o más allá (replied+): **" + summary.reply_or_beyond + "**",
    "- Perdidas (`lost`): **" + summary.lost_total + "**",
    "",
    "## Familias (entre aplicadas o posteriores)",
    ""
  );

  const families = Object.keys(summary.family_applications).sort();
  if (families.length) {
    lines.push("| Familia | Aplicadas | Respuesta+ |", "| --- | ---: | ---: |");
    for (const family of families) {
      lines.push(
        "| " + family +
        " | " + (summary.family_applications[family] ?? 0) +
        " | " + (summary.family_positive_outcomes[family] ?? 0) + " |"
      );
    }
  } else {
    lines.push("_Sin aplicaciones registradas todavía._");
  }

  lines.push("", "## CV usado (aplicadas)", "");
  const cvs = Object.entries(summary.cv_used_counts);
  if (cvs.length) {
    for (const [cv, count] of cvs) lines.push("- " + cv + ": " + count);
  } else {
    lines.push("_Registrar con `node scripts/opportunity-track.mjs status <id> applied --cv ...`_");
  }

  lines.push(
    "",
    "## Comandos",
    "",
    "```bash",
    "node scripts/opportunity-track.mjs status <id> <estado> [--cv ...] [--note ...]",
    "node scripts/opportunity-track.mjs feedback <id> <signal> [--note ...]",
    "node scripts/opportunity-track.mjs report",
    "```",
    ""
  );

  return lines.join("\n");
}
