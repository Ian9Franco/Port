/**
 * Match a term as its own token. "java" does not match "javascript",
 * and "sql" does not match "postgresql".
 */
export function termMatches(text, term) {
  const hay = String(text ?? "").toLowerCase();
  const needle = String(term ?? "").toLowerCase().trim();
  if (!needle || !hay) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const pattern = new RegExp("(?:^|[^a-z0-9+#])" + escaped + "(?:$|[^a-z0-9+#])", "i");
  return pattern.test(hay);
}

export function matchesAnyTerm(text, terms) {
  return (terms ?? []).some(term => termMatches(text, term));
}
