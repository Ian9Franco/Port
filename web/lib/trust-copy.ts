const LEVEL: Record<string, string> = {
  low: "baja",
  medium: "media",
  high: "alta",
  unknown: "desconocida"
};

const RISK: Record<string, string> = {
  low: "bajo",
  medium: "medio",
  high: "alto",
  unknown: "desconocido"
};

const WARNINGS: Record<string, string> = {
  listing_url_off_board: "La URL del aviso no está en el dominio del board.",
  missing_company_name: "Falta el nombre de la empresa.",
  short_description: "La descripción guardada es muy corta.",
  salary_outlier: "El salario publicado parece fuera de rango.",
  scam_pattern: "El texto coincide con un patrón de estafa.",
  gambling_industry: "El texto parece de apuestas o casino.",
  apply_url_external: "La postulación sale del board.",
  duplicate_listing_cluster: "Hay otros avisos parecidos agrupados."
};

const SIGNALS: Record<string, string> = {
  listing_on_official_board: "El aviso está en el dominio del board.",
  apply_url_ats_or_careers: "La postulación apunta a un ATS o a una página de empleos."
};

export type StoredTrust = {
  listing_risk?: string;
  company_trust?: string;
  source_trust?: string;
  warnings?: string[];
  signals?: string[];
};

function gloss(table: Record<string, string>, value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  return table[value] ?? value;
}

export function trustReadout(trust: StoredTrust | null | undefined) {
  const company = trust?.company_trust;
  const risk = trust?.listing_risk;
  const warnings = (trust?.warnings ?? []).map(code => WARNINGS[code] ?? `Código sin glosa: ${code}`);
  const signals = (trust?.signals ?? []).map(code => SIGNALS[code] ?? `Código sin glosa: ${code}`);
  const missing = !trust || (!company && !risk && warnings.length === 0 && signals.length === 0);
  return {
    companyTrust: gloss(LEVEL, company, "desconocida"),
    listingRisk: gloss(RISK, risk, "desconocido"),
    sourceTrust: trust?.source_trust?.trim() || "desconocida",
    warnings,
    signals,
    missing
  };
}
