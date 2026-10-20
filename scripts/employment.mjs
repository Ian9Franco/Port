const SIDE_TYPES = new Set(["part_time", "contract", "freelance"]);
const SIDE_PHRASES = ["freelance", "freelancer", "contract", "contractor", "part-time", "part time", "fixed-price", "fixed price", "hourly"];

export function normalizeEmployment(value = "") {
  if (value && typeof value === "object") {
    const nested = value.data?.attributes?.locale_key
      ?? value.data?.attributes?.name
      ?? value.attributes?.locale_key
      ?? value.attributes?.name
      ?? value.locale_key
      ?? value.name
      ?? "";
    if (nested && nested !== value) return normalizeEmployment(nested);
    return "unknown";
  }

  const text = String(value ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  if (!text || text === "undefined" || text === "null" || text.includes("object_object") || text === "[object_object]") {
    return "unknown";
  }
  if (text.includes("part")) return "part_time";
  if (text.includes("contract") || text.includes("freelance") || text.includes("contractor")) {
    return text.includes("freelance") ? "freelance" : "contract";
  }
  if (text.includes("full")) return "full_time";
  if (text.includes("intern")) return "internship";
  return text;
}

/**
 * SIDE is extra income beside a MAIN job. Unknown and full-time do not qualify.
 * A clearly bounded freelance/contract phrase in the listing does.
 */
export function confirmedSideNature(job) {
  const employment = normalizeEmployment(job?.employment_type ?? "");
  if (SIDE_TYPES.has(employment)) return true;
  if (employment === "full_time" || employment === "unknown" || employment === "internship") return false;
  const text = [job?.title, job?.description].filter(Boolean).join(" ").toLowerCase();
  return SIDE_PHRASES.some(phrase => text.includes(phrase));
}
