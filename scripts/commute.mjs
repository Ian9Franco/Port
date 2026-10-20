/**
 * Venue dictionary (id → name published by the source) and commute(origin, sede).
 * A number is returned only when both ends exist and a distance was already
 * published. Zona oeste has no municipality, so today's calls stay unknown.
 * Valencia is not a daily commute and is not given a distance.
 */

function rowsOf(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.data)) return value.data;
  return [];
}

export function publishedVenue(attr = {}) {
  const cities = [];
  const tenants = [];
  const unresolved_ids = [];

  for (const row of rowsOf(attr.location_cities)) {
    const name = row?.attributes?.name;
    if (typeof name === "string" && name.trim()) {
      const country = row?.attributes?.country;
      cities.push({
        id: String(row.id ?? ""),
        name: name.trim(),
        country: typeof country === "string" && country.trim() ? country.trim() : null
      });
    } else if (row?.id != null && String(row.id).length) {
      unresolved_ids.push(String(row.id));
    }
  }

  for (const row of rowsOf(attr.location_tenants)) {
    const name = row?.attributes?.name;
    if (typeof name === "string" && name.trim()) {
      tenants.push({ id: String(row.id ?? ""), name: name.trim() });
    } else if (row?.id != null && String(row.id).length) {
      unresolved_ids.push(String(row.id));
    }
  }

  return { cities, tenants, unresolved_ids };
}

export function venueLocation(venue, countryNames = []) {
  const cities = (venue?.cities ?? [])
    .filter(city => city?.name)
    .map(city => city.country ? city.name + ", " + city.country : city.name);
  if (cities.length) return cities.join("; ");
  const tenants = (venue?.tenants ?? []).map(tenant => tenant?.name).filter(Boolean);
  if (tenants.length) return tenants.join(", ");
  const countries = (countryNames ?? []).map(name => String(name).trim()).filter(Boolean);
  if (countries.length) return countries.join(", ");
  return "Remote";
}

export function sedeFromJob(job) {
  const venue = job?.venue;
  const city = (venue?.cities ?? []).find(entry => entry?.name);
  if (city) return { id: city.id, name: city.name, country: city.country ?? null, country_only: false };

  const namedTenant = (venue?.tenants ?? []).find(entry => entry?.name);
  if (!city && venue?.unresolved_ids?.length && !namedTenant) {
    return { id: venue.unresolved_ids[0], name: null, unresolved_only: true };
  }

  const location = String(job?.location ?? "").trim();
  if (!location || /^remote$/i.test(location)) return { name: null, unresolved_only: Boolean(venue?.unresolved_ids?.length) };
  if (/^argentina$/i.test(location)) return { name: "Argentina", country_only: true };
  if (/\b(valencia|spain|españa|espana)\b/i.test(location)) return { name: location, daily: false };
  return { name: location, country_only: false };
}

export function commute(origin, sede) {
  if (!sede || sede.daily === false) return { status: "not_a_daily_commute", km: null };

  const originNamed = origin?.municipality != null && String(origin.municipality).trim() !== "";
  const sedeNamed = typeof sede.name === "string" && sede.name.trim() !== "" && sede.country_only !== true && sede.unresolved_only !== true;
  if (!originNamed || !sedeNamed) return { status: "unknown", km: null };
  if (typeof sede.distance_km !== "number") return { status: "unknown", km: null };
  return { status: "measured", km: sede.distance_km };
}

export function explainCommute(job, config, flags = {}) {
  const origin = config?.geography?.home ?? { label: "zona oeste, Buenos Aires", municipality: null };
  const spainOnly = flags.work_after_valencia === true && flags.work_from_zona_oeste !== true;
  if (spainOnly || sedeFromJob(job).daily === false) {
    return {
      status: "not_a_daily_commute",
      km: null,
      note: "no es viaje diario; commute() no recibe Valencia"
    };
  }

  const local = job?.remote !== true;
  if (!local) {
    return {
      status: "not_a_daily_commute",
      km: null,
      note: "sin viaje diario desde " + (origin.label ?? "zona oeste, Buenos Aires")
    };
  }

  const result = commute(origin, sedeFromJob(job));
  const note = result.status === "measured"
    ? "viaje " + result.km + " km desde " + origin.label
    : "costo de viaje desde " + origin.label + ": unknown (sin municipio de origen, sin nombre publicado, o la sede es solo un país)";
  return { ...result, note };
}
