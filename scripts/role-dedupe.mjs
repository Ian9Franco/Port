const TITLE_STOP = new Set([
  "senior", "sr", "staff", "principal", "lead", "head", "junior", "jr",
  "engineer", "developer", "desarrollador", "desarrolladora", "the", "and", "for", "with"
]);

function companyKey(company) {
  return String(company ?? "")
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|gmbh|sa|srl|corp)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleTokens(title) {
  return String(title ?? "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .split(/[^a-z0-9]+/)
    .filter(token => token.length > 2 && !TITLE_STOP.has(token));
}

function jaccard(left, right) {
  if (!left.length || !right.length) return 0;
  const rightSet = new Set(right);
  let shared = 0;
  for (const token of left) {
    if (rightSet.has(token)) shared += 1;
  }
  const union = new Set([...left, ...right]).size;
  return union ? shared / union : 0;
}

/**
 * Keep the highest-ranked row when the same company posts the same role twice.
 * The wider universe is unchanged; this only protects the short list.
 */
export function collapseNearDuplicates(jobs, scoreKey, threshold = 0.64) {
  const kept = [];
  const signatures = [];

  for (const job of jobs) {
    const company = companyKey(job.company);
    const tokens = titleTokens(job.title);
    const duplicate = signatures.findIndex(signature =>
      signature.company === company && jaccard(signature.tokens, tokens) >= threshold
    );
    if (duplicate === -1) {
      kept.push(job);
      signatures.push({ company, tokens });
      continue;
    }
    const current = kept[duplicate];
    if ((job[scoreKey] ?? 0) > (current[scoreKey] ?? 0)) {
      kept[duplicate] = job;
      signatures[duplicate] = { company, tokens };
    }
  }

  return kept;
}
