import { termMatches } from "./text-match.mjs";

/**
 * Small grammar over the title and the first requirements.
 * sap_technical: BTP, CAP, Integration Suite, SAP APIs.
 * sap_functional: FICO, Basis, HCM, SuccessFactors, or an SAP module with no build.
 */

const TECHNICAL = [
  "sap btp",
  "btp",
  "sap cap",
  "cloud application programming",
  "integration suite",
  "sap api",
  "sap apis"
];

const FUNCTIONAL = [
  "fico",
  "fi-co",
  "fi/co",
  "sap basis",
  "successfactors",
  "success factors",
  "sap hcm",
  "sap mm",
  "sap sd",
  "sap pp",
  "sap wm",
  "sap fi",
  "sap co"
];

function hasTerm(text, term) {
  return termMatches(text, term) || text.includes(term);
}

export function classifySap(title, requirementsText) {
  const text = (String(title ?? "") + " " + String(requirementsText ?? "")).toLowerCase();
  const mentionsSap = /\bsap\b/.test(text) || TECHNICAL.some(term => hasTerm(text, term)) || /successfactors|success factors/.test(text);
  if (!mentionsSap) return null;

  const technical = TECHNICAL.some(term => hasTerm(text, term));
  const functional = FUNCTIONAL.some(term => hasTerm(text, term));
  if (technical && !functional) return "sap_technical";
  if (functional || !technical) return "sap_functional";
  return null;
}
