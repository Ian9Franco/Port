export type ListingLanguage = "es" | "en" | "de" | "pt" | "fr" | "it";

const WORDS: Record<ListingLanguage, string[]> = {
  es: [
    "del", "los", "las", "que", "para", "con", "una", "por", "experiencia",
    "buscamos", "años", "conocimiento", "requisitos", "desarrollo", "también",
    "usted", "nosotros", "trabajo", "empresa"
  ],
  en: [
    "the", "and", "with", "for", "you", "our", "we", "your", "this", "from",
    "have", "will", "about", "team", "experience", "requirements", "role", "job"
  ],
  de: ["und", "der", "die", "das", "mit", "für", "nicht", "wir", "eine", "ein", "erfahrung", "stelle"],
  pt: ["não", "você", "vocês", "uma", "para", "com", "experiência", "vaga", "trabalho"],
  fr: ["les", "des", "une", "pour", "avec", "nous", "vous", "expérience", "poste", "dans"],
  it: ["che", "per", "con", "una", "della", "esperienza", "lavoro", "siamo", "non"]
};

function tokensOf(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function score(tokens: string[], words: string[]): number {
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  let total = 0;
  for (const word of words) total += counts.get(word) ?? 0;
  return total;
}

/** Spanish listings stay as they are. Anything else is a translation source. */
export function detectListingLanguage(text: string): ListingLanguage {
  const tokens = tokensOf(text);
  const scored = (Object.keys(WORDS) as ListingLanguage[]).map(code => ({
    code,
    total: score(tokens, WORDS[code])
  }));
  const es = scored.find(row => row.code === "es")?.total ?? 0;
  const en = scored.find(row => row.code === "en")?.total ?? 0;
  const pt = scored.find(row => row.code === "pt")?.total ?? 0;
  if (es >= 2 && es >= en && es >= pt) return "es";

  const foreign = scored
    .filter(row => row.code !== "es")
    .sort((a, b) => b.total - a.total);
  const winner = foreign[0];
  if (winner && winner.total >= 2) return winner.code;
  return "en";
}

export function translationSource(text: string): ListingLanguage | null {
  const detected = detectListingLanguage(text);
  return detected === "es" ? null : detected;
}
