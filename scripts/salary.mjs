/**
 * Salary is a value or unparsed. The floor is 1000000 ARS / month.
 * Gross versus net stays unknown. Only ARS amounts are compared.
 * Other currencies, and figures with no currency, stay incomparable.
 * Nothing here drops a listing.
 */

const CURRENCIES = [
  { code: "ARS", pattern: /\b(ars|ar\$|pesos argentinos|peso argentino)\b/i },
  { code: "USD", pattern: /\b(usd|us\$|u\$s)\b/i },
  { code: "EUR", pattern: /\b(eur)\b|€/i },
  { code: "INR", pattern: /\b(inr)\b/i }
];

function normalizeNumber(token) {
  const raw = String(token).trim();
  if (/^\d{1,3}(\.\d{3})+$/.test(raw)) return Number(raw.replace(/\./g, ""));
  if (/^\d{1,3}(,\d{3})+$/.test(raw)) return Number(raw.replace(/,/g, ""));
  if (/^\d+,\d{1,2}$/.test(raw)) return Number(raw.replace(",", "."));
  return Number(raw.replace(/[^\d.]/g, ""));
}

function periodOf(raw) {
  if (/\b(year|yearly|annual|annually|anual|per annum)\b/i.test(raw)) return "yearly";
  if (/\b(month|monthly|mensual|per month)\b/i.test(raw)) return "monthly";
  if (/\b(hour|hourly)\b/i.test(raw)) return "hourly";
  if (/\b(week|weekly)\b/i.test(raw)) return "weekly";
  return "unknown";
}

export function parseSalary(input, source = "listing") {
  if (input && typeof input === "object") {
    if (input.status === "parsed" || input.status === "unparsed") {
      return { ...input, gross_or_net: "unknown", source: input.source || source };
    }
    if (typeof input.raw === "string") return parseSalary(input.raw, input.source || source);
  }

  const raw = String(input ?? "").trim();
  if (!raw) return { status: "unparsed", source, gross_or_net: "unknown" };

  const currency = CURRENCIES.find(entry => entry.pattern.test(raw))?.code ?? null;
  if (!currency) return { status: "unparsed", source, raw, gross_or_net: "unknown" };

  const numbers = [...raw.matchAll(/\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?/g)]
    .map(match => normalizeNumber(match[0]))
    .filter(value => Number.isFinite(value) && value > 0);
  if (!numbers.length) return { status: "unparsed", source, raw, gross_or_net: "unknown" };

  return {
    status: "parsed",
    amount: Math.min(...numbers),
    amount_max: Math.max(...numbers),
    currency,
    period: periodOf(raw),
    gross_or_net: "unknown",
    source,
    raw
  };
}

export function floorFromConstraints(constraints) {
  const main = constraints?.compensation?.main ?? {};
  return {
    amount: typeof main.minimum_monthly_baseline === "number" ? main.minimum_monthly_baseline : null,
    currency: main.currency ?? null,
    period: main.period ?? "monthly",
    gross_or_net: "unknown"
  };
}

function monthlyAmount(value) {
  if (value.period === "monthly") return value.amount;
  if (value.period === "yearly") return value.amount / 12;
  return null;
}

export function compareSalary(value, floor) {
  if (!value || value.status !== "parsed" || !value.currency || !floor?.currency || floor.amount == null) {
    return { status: "incomparable", gross_or_net: "unknown" };
  }
  if (value.currency !== "ARS" || floor.currency !== "ARS") {
    return { status: "incomparable", currency: value.currency, gross_or_net: "unknown" };
  }
  const monthly = monthlyAmount(value);
  const floorMonthly = floor.period === "yearly" ? floor.amount / 12 : floor.period === "monthly" ? floor.amount : null;
  if (monthly == null || floorMonthly == null) {
    return { status: "incomparable", currency: "ARS", gross_or_net: "unknown" };
  }
  let relation = "meets";
  if (monthly > floorMonthly) relation = "above";
  else if (monthly < floorMonthly) relation = "below";
  return {
    status: "compared",
    relation,
    monthly_amount: Math.round(monthly),
    floor_monthly: Math.round(floorMonthly),
    currency: "ARS",
    gross_or_net: "unknown"
  };
}

export function salaryComparisonNote(job, constraints) {
  const floor = floorFromConstraints(constraints);
  const value = job?.salary_value?.status ? parseSalary(job.salary_value, job?.source) : parseSalary(job?.salary, job?.source);
  const comparison = compareSalary(value, floor);
  const floorLabel = (floor.amount ?? "sin piso") + " " + (floor.currency || "sin moneda") + " / " + (floor.period || "monthly");
  if (comparison.status !== "compared") {
    const why = value.currency && value.currency !== "ARS"
      ? "moneda " + value.currency
      : "aviso sin moneda o sin período mensual/anual";
    return "salario incomparable (" + why + ") · piso " + floorLabel + " · bruto/neto desconocido · no filtra";
  }
  return "salario " + comparison.monthly_amount + " ARS / monthly · piso " + floorLabel + " · " + comparison.relation + " · bruto/neto desconocido · no filtra";
}
