const LEGAL_SUFFIX =
  /\b(incorporated|inc|l\.?\s*l\.?\s*c|llc|ltd|limited|corp|corporation|gmbh|s\.?\s*a|s\.?\s*r\.?\s*l|srl|plc|company|group|international|holdings|the)\b/gi;

export function normalizeOrgName(value: string): string {
  const withoutNotes = value.replace(/\([^)]*\)/g, " ");
  const lowered = withoutNotes.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const stripped = lowered
    .replace(LEGAL_SUFFIX, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (stripped.length >= 2) return stripped;
  return lowered.replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export function namesMatch(company: string, label: string): boolean {
  const left = normalizeOrgName(company);
  const right = normalizeOrgName(label);
  return left.length >= 2 && left === right;
}
