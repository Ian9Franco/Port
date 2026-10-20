/**
 * Split a listing into mandatory and desirable requirements before scoring.
 * Get on Board publishes functions vs desirable. Other sources yield a list
 * or status "unread". Fit is covered mandatory / mandatory count.
 */

function stripTags(value) {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h\d|div)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function listItems(text) {
  const lines = String(text ?? "").split(/\n+/).map(line => line.trim()).filter(Boolean);
  const items = [];
  for (const line of lines) {
    if (!/^([-*•–]|\d+[.)])\s+/.test(line)) continue;
    const cleaned = line.replace(/^([-*•–]|\d+[.)])\s+/, "").trim();
    if (cleaned.length >= 8 && cleaned.length <= 400) items.push(cleaned);
  }
  return [...new Set(items)];
}

const DESIRABLE_SPLIT = /\b(nice to have|nice-to-have|good to have|desirable|deseable|preferred qualifications|bonus points|plus:)\b/i;

export function splitRequirements(job) {
  if (Array.isArray(job?.mandatory_requirements) && job.mandatory_requirements.length) {
    return {
      status: "read",
      mandatory: job.mandatory_requirements.map(item => String(item).trim()).filter(Boolean),
      desirable: Array.isArray(job?.desirable_requirements)
        ? job.desirable_requirements.map(item => String(item).trim()).filter(Boolean)
        : []
    };
  }

  const mandatorySource = job?.mandatory_text;
  if (typeof mandatorySource === "string" && mandatorySource.trim()) {
    const mandatory = listItems(stripTags(mandatorySource));
    const desirable = typeof job?.desirable_text === "string" ? listItems(stripTags(job.desirable_text)) : [];
    if (mandatory.length) return { status: "read", mandatory, desirable };
    return { status: "unread", mandatory: [], desirable };
  }

  if (job?.description_truncated === true) {
    return { status: "unread", mandatory: [], desirable: [] };
  }

  const text = stripTags(job?.description ?? "");
  const parts = text.split(DESIRABLE_SPLIT);
  const mandatory = listItems(parts[0] ?? "");
  const desirable = listItems(parts.slice(1).join("\n"));
  if (mandatory.length) return { status: "read", mandatory, desirable };
  return { status: "unread", mandatory: [], desirable: [] };
}
