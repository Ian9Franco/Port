import { matchesAnyTerm } from "./text-match.mjs";

function normalized(...parts) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function compact(text) {
  return text.replace(/[^a-z0-9]+/g, " ").trim();
}

export function placeText(job) {
  return normalized(job?.location, job?.place_text, job?.title);
}

export function argentinaCompatible(text, geo) {
  return matchesAnyTerm(text, geo.argentina_remote_terms);
}

export function spainOrValencia(text, geo) {
  return matchesAnyTerm(text, geo.spain_terms) || matchesAnyTerm(text, geo.valencia_terms);
}

/** Valencia, or Spain without a long list of other countries. */
export function spainFocused(text, geo) {
  if (!spainOrValencia(text, geo)) return false;
  if (mentionsValencia(text, geo)) return true;
  const pieces = text.split(/[,;|/]/).map(part => part.trim()).filter(part => part.length > 2);
  return pieces.length <= 3;
}

export function mentionsValencia(text, geo) {
  return matchesAnyTerm(text, geo.valencia_terms);
}

function bareRemote(text) {
  const value = compact(text);
  return value === "" || value === "remote" || value === "remoto";
}

/**
 * Where this listing can be done from.
 * remote-now: workable from zona oeste now (Argentina-compatible remote).
 * local-onsite: AMBA / Argentina onsite or hybrid. Commute starts at zona oeste; distance is not invented.
 * relocation-watch: Spain or Valencia, for a later move with family. Not generic Europe.
 * foreign-onsite: another country's onsite role. Not a commute.
 * restricted-remote: remote that does not include Argentina and is not Spain.
 */
export function classifyAccess(job, config) {
  const geo = config?.geography;
  if (!geo?.home || !geo?.relocation) {
    throw new Error("config.geography.home and config.geography.relocation are required");
  }

  const text = placeText(job);
  const remote = job?.remote === true;
  const spain = spainOrValencia(text, geo);
  const fromArgentina = argentinaCompatible(text, geo);
  const local = matchesAnyTerm(text, geo.local_onsite_terms);
  const countryArgentina = matchesAnyTerm(text, geo.argentina_country_terms);

  if (!remote) {
    if (spainFocused(text, geo)) return "relocation-watch";
    if (local || countryArgentina) return "local-onsite";
    return "foreign-onsite";
  }

  if (fromArgentina) return "remote-now";
  if (spainFocused(text, geo)) return "relocation-watch";
  if (bareRemote(text)) return "remote-unclear";
  return "restricted-remote";
}

export function commuteNote(access, config) {
  const home = config.geography.home.label;
  if (access === "local-onsite") {
    return "costo de viaje desde " + home + "; municipio no conocido, distancia no calculada";
  }
  if (access === "relocation-watch") {
    return "no es viaje diario: posibilidad futura de mudarse a Valencia con la familia";
  }
  if (access === "remote-now" || access === "remote-unclear") {
    return "sin viaje diario desde " + home;
  }
  return "fuera de zona oeste y fuera de Valencia/España";
}

export function commuteBurden(access) {
  if (access === "remote-now" || access === "remote-unclear") return 8;
  if (access === "relocation-watch") return 12;
  if (access === "local-onsite") return 42;
  if (access === "foreign-onsite") return 90;
  return 70;
}

export function relocationScore(text, access, geo) {
  let score = access === "relocation-watch" ? 58 : 18;
  if (mentionsValencia(text, geo)) score += 28;
  else if (spainOrValencia(text, geo)) score += 16;
  const moveSignal = matchesAnyTerm(text, geo.relocation_signals);
  if (moveSignal && spainOrValencia(text, geo)) score += 10;
  if (geo.relocation?.with_family && access === "relocation-watch") score += 4;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function salaryComparisonNote(job, constraints) {
  const listed = String(job?.salary ?? "").trim();
  const main = constraints?.compensation?.main ?? {};
  const floor = main.minimum_monthly_baseline ?? "sin piso";
  const currency = main.currency ?? "to_confirm";
  const shown = listed || "no indicado";
  return "salario del aviso: " + shown + " · piso MAIN ~" + floor + " (moneda " + currency + ", no filtra)";
}
