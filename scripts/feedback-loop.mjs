import fs from "node:fs/promises";
import { loadTrackingConfig } from "./tracking.mjs";

const FEEDBACK_PATH = "data/feedback.json";
const DAMPING = 0.35;
const MAX_ABS = 5;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export async function loadFeedbackState() {
  try {
    return JSON.parse(await fs.readFile(FEEDBACK_PATH, "utf8"));
  } catch {
    return {
      version: 1,
      events: [],
      weight_adjustments: { role_families: {}, keywords: {}, sources: {}, explanations: [] }
    };
  }
}

export async function saveFeedbackState(state) {
  await fs.writeFile(FEEDBACK_PATH, JSON.stringify(state, null, 2) + "\n");
}

function aggregateAdjustments(events, config) {
  const roleFamilies = {};
  const keywords = {};
  const sources = {};
  const explanations = [];

  for (const event of events.slice(-80)) {
    const signalConfig = config.feedback_signals?.[event.signal];
    if (!signalConfig) continue;

    const delta = signalConfig.weight * DAMPING;
    const parts = [];

    for (const family of event.role_families ?? []) {
      roleFamilies[family] = clamp((roleFamilies[family] ?? 0) + delta, -MAX_ABS, MAX_ABS);
      parts.push("family:" + family);
    }

    for (const keyword of event.keywords ?? []) {
      keywords[keyword] = clamp((keywords[keyword] ?? 0) + delta, -MAX_ABS, MAX_ABS);
      parts.push("kw:" + keyword);
    }

    if (event.source) {
      sources[event.source] = clamp((sources[event.source] ?? 0) + delta, -MAX_ABS, MAX_ABS);
      parts.push("source:" + event.source);
    }

    if (parts.length) {
      explanations.push({
        at: event.at,
        signal: event.signal,
        opportunity_id: event.opportunity_id,
        delta: Number(delta.toFixed(2)),
        targets: parts.join(", ")
      });
    }
  }

  return {
    role_families: roleFamilies,
    keywords,
    sources,
    explanations: explanations.slice(-30)
  };
}

export async function recordFeedbackEvent({ opportunity, signal, note }) {
  const config = await loadTrackingConfig();
  const signalConfig = config.feedback_signals?.[signal];
  if (!signalConfig) {
    throw new Error("Unknown feedback signal: " + signal);
  }

  const state = await loadFeedbackState();
  const at = new Date().toISOString();

  state.events.push({
    at,
    signal,
    note: note ?? "",
    opportunity_id: opportunity.id,
    title: opportunity.title,
    company: opportunity.company,
    source: opportunity.source,
    role_families: opportunity.potential?.role_families ?? [],
    keywords: opportunity.matched_keywords ?? []
  });

  state.events = state.events.slice(-200);
  state.weight_adjustments = aggregateAdjustments(state.events, config);

  await saveFeedbackState(state);
  return { state, suggested_status: signalConfig.maps_to_status };
}

export function computeFeedbackRankBonus(opportunity, adjustments) {
  if (!adjustments) return { bonus: 0, reasons: [] };

  let bonus = 0;
  const reasons = [];

  for (const family of opportunity.potential?.role_families ?? []) {
    const delta = adjustments.role_families?.[family] ?? 0;
    if (delta) {
      bonus += delta;
      reasons.push("feedback family " + family + " " + (delta > 0 ? "+" : "") + delta.toFixed(1));
    }
  }

  for (const keyword of opportunity.matched_keywords ?? []) {
    const delta = adjustments.keywords?.[keyword] ?? 0;
    if (delta) {
      bonus += delta * 0.5;
      reasons.push("feedback keyword " + keyword + " " + (delta > 0 ? "+" : "") + (delta * 0.5).toFixed(1));
    }
  }

  const sourceDelta = adjustments.sources?.[opportunity.source] ?? 0;
  if (sourceDelta) {
    bonus += sourceDelta * 0.4;
    reasons.push("feedback source " + opportunity.source + " " + (sourceDelta > 0 ? "+" : "") + (sourceDelta * 0.4).toFixed(1));
  }

  return { bonus: Math.round(bonus * 10) / 10, reasons };
}
