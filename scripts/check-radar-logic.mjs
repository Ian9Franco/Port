import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { loadCareerModel } from "./load-career-model.mjs";
import { evaluatePotential } from "./potential-matcher.mjs";
import { normalizeEmployment, confirmedSideNature } from "./employment.mjs";
import { commute, explainCommute, publishedVenue, venueLocation } from "./commute.mjs";
import { placeFlags, classifyAccess } from "./geography.mjs";
import { collapseNearDuplicates, mergeByBlockingKey, shortList } from "./role-dedupe.mjs";
import { compareSalary, floorFromConstraints, parseSalary } from "./salary.mjs";
import { classifySap } from "./sap-grammar.mjs";
import { termMatches } from "./text-match.mjs";

const config = JSON.parse(await fs.readFile("config/radar.json", "utf8"));
const careerModel = await loadCareerModel();
const matcherProfile = careerModel.matcher_profile;

function fail(message) {
  throw new Error(message);
}

function evaluate(job, access = classifyAccess(job, config)) {
  return evaluatePotential(job, { careerModel, matcherProfile, config, access });
}

assert.equal(termMatches("javascript and java", "java"), true);
assert.equal(termMatches("javascript engineer", "java"), false);
assert.equal(termMatches("postgresql queries", "sql"), false);
assert.equal(termMatches("we use next.js", "next.js"), true);

const skills = careerModel.github_evidence.capabilities.map(cap => cap.skill);
assert.equal(skills.includes("Zapier"), false);
const terms = careerModel.github_evidence.capabilities.flatMap(cap => cap.match_terms ?? []);
for (const banned of ["ai", "api", "build", "bi", "rest", "sql", "java"]) {
  assert.equal(terms.includes(banned), false, banned + " is still a match term");
}

assert.equal(normalizeEmployment({ data: { attributes: { locale_key: "full_time", name: "Full time" } } }), "full_time");
assert.equal(normalizeEmployment({}), "unknown");
assert.equal(confirmedSideNature({ employment_type: "unknown", title: "Senior Backend Engineer", remote: true }), false);
assert.equal(confirmedSideNature({ employment_type: "full_time", title: "Engineer", remote: true }), false);
assert.equal(confirmedSideNature({ employment_type: "freelance", title: "Next.js contract", remote: true }), true);

assert.equal(classifyAccess({ remote: true, location: "Worldwide" }, config), "remote-now");
assert.equal(classifyAccess({ remote: true, location: "Latin America, Europe" }, config), "remote-now");
assert.equal(classifyAccess({ remote: false, location: "Buenos Aires" }, config), "local-onsite");
assert.equal(classifyAccess({ remote: false, location: "Argentina" }, config), "local-onsite");
assert.equal(classifyAccess({ remote: false, location: "Chile" }, config), "foreign-onsite");
assert.equal(classifyAccess({ remote: false, location: "Valencia, Spain", title: "Backend Developer" }, config), "relocation-watch");
assert.equal(classifyAccess({ remote: true, location: "Spain", title: "Backend Developer" }, config), "relocation-watch");
assert.equal(classifyAccess({ remote: true, location: "Europe" }, config), "restricted-remote");
assert.equal(classifyAccess({ remote: true, location: "Spain", title: "DevOps Engineer" }, config), "relocation-watch");
assert.equal(classifyAccess({
  remote: true,
  location: "Albania, France, Germany, Spain, Sweden",
  title: "Data Engineer"
}, config), "restricted-remote");

const linguistic = evaluate({
  title: "Finnish Tech Linguistic Tester",
  description: "linguistic testing on desktop computers",
  location: "Anywhere",
  remote: true,
  employment_type: "full_time"
});
assert.equal(linguistic.main_eligible, false);
assert.ok(linguistic.current_fit < 70, "linguistic fit " + linguistic.current_fit);
assert.equal(classifyAccess({ remote: true, location: "Remote" }, config), "remote-unclear");
assert.equal(config.geography.home.municipality, null);
assert.equal(config.geography.relocation.family_location, "Valencia, Spain");
assert.equal(config.geography.relocation.immediate, false);
assert.equal(careerModel.constraints.home.municipality, null);

const seniorJs = evaluate({
  title: "Senior JavaScript Engineer",
  description: "javascript react next.js typescript",
  location: "Worldwide",
  remote: true,
  employment_type: "full_time",
  description_truncated: false
});
assert.equal(seniorJs.gaps.some(gap => gap.term === "java"), false);
assert.ok(seniorJs.current_fit < 100, "senior fit stayed at " + seniorJs.current_fit);
assert.ok(seniorJs.reasons.some(reason => reason.includes("seniority")));
assert.equal(seniorJs.side_eligible, false);

const truncated = evaluate({
  title: "Backend Engineer",
  description: "node.js typescript postgresql",
  location: "Argentina",
  remote: true,
  employment_type: "full_time",
  description_truncated: true
});
assert.notEqual(truncated.gap_cost, "low");
assert.ok(truncated.gaps.some(gap => gap.type === "unknown"));

const chile = evaluate({
  title: "Senior Full-Stack Engineer",
  description: "react next.js typescript node.js postgresql",
  location: "Chile",
  remote: false,
  employment_type: "full_time"
});
assert.equal(chile.retain, false);

const valencia = evaluate({
  title: "Backend Developer",
  description: "typescript node.js postgresql in our Valencia office",
  location: "Valencia, Spain",
  remote: false,
  employment_type: "full_time"
});
assert.equal(valencia.relocation_watch, true);
const fico = evaluate({
  title: "Senior SAP FICO Consultant",
  description: "sap fico finance consulting in Madrid",
  location: "Spain",
  remote: true,
  employment_type: "full_time"
});
assert.equal(fico.retain, false);
const rater = evaluate({
  title: "Valencia Translation Quality Rater",
  description: "rate translated sentences",
  location: "Valencia, Spain",
  remote: true,
  employment_type: "contract"
});
assert.equal(rater.relocation_watch, false);
assert.equal(valencia.main_eligible, false);
assert.equal(valencia.relocation_value, "not_yet_ordered");
assert.equal(valencia.move_window, "unknown");
assert.equal(valencia.work_from_zona_oeste, false);
assert.equal(valencia.work_after_valencia, true);
assert.equal(valencia.commute_status, "not_a_daily_commute");
assert.equal(valencia.commute_km, null);
assert.equal(fico.sap_kind, "sap_functional");

const europeList = evaluate({
  title: "Full-Stack Engineer",
  description: "react next.js",
  location: "Northern America, LATAM, Europe, APAC",
  remote: true,
  employment_type: "full_time"
});
assert.equal(europeList.relocation_watch, false);
assert.equal(classifyAccess({ remote: true, location: "Northern America, LATAM, Europe, APAC" }, config), "remote-now");

const freelance = evaluate({
  title: "Freelance Next.js developer",
  description: "part-time contract. next.js typescript react supabase",
  location: "Worldwide",
  remote: true,
  employment_type: "freelance"
});
assert.equal(freelance.requirements_status, "unread");
assert.equal(freelance.side_eligible, false);
assert.ok(freelance.current_fit <= 40);
const freelanceListed = evaluate({
  title: "Freelance Next.js developer",
  description: "part-time contract",
  mandatory_requirements: ["next.js", "typescript", "react", "supabase"],
  location: "Worldwide",
  remote: true,
  employment_type: "freelance"
});
assert.equal(freelanceListed.requirements_status, "read");
assert.equal(freelanceListed.side_eligible, true);

const collapsed = collapseNearDuplicates([
  { company: "ElevenLabs", title: "Full-Stack Engineer - Creative Agents", main_score: 70 },
  { company: "ElevenLabs", title: "Full-Stack Engineer (Backend Leaning) - Creative Agents", main_score: 68 },
  { company: "Other", title: "Data Engineer", main_score: 60 }
], "main_score");
assert.equal(collapsed.length, 2);

if (config.roles.keyword_score_gates_retention !== false) fail("keyword score still gates retention");

const half = evaluate({
  title: "Backend Engineer",
  mandatory_requirements: ["typescript", "kubernetes administration"],
  description: "typescript",
  location: "Worldwide",
  remote: true,
  employment_type: "full_time"
});
assert.equal(half.requirements_status, "read");
assert.equal(half.current_fit, 50);
assert.notEqual(half.gap_cost, "low");

const unread = evaluate({
  title: "Backend Engineer",
  description: "we are a team that ships product",
  location: "Worldwide",
  remote: true,
  employment_type: "full_time"
});
assert.equal(unread.requirements_status, "unread");
assert.ok(unread.current_fit <= 40, "unread fit " + unread.current_fit);
assert.notEqual(unread.gap_cost, "low");

const worldwide = placeFlags({ remote: true, location: "Worldwide" }, config);
assert.equal(worldwide.work_from_zona_oeste, true);
assert.equal(worldwide.work_after_valencia, true);
assert.equal(worldwide.place_bridge, true);
const latamEurope = placeFlags({ remote: true, location: "Latin America, Europe" }, config);
assert.equal(latamEurope.work_from_zona_oeste, true);
assert.equal(latamEurope.work_after_valencia, false);
assert.equal(latamEurope.place_bridge, false);
const spainOnly = placeFlags({ remote: true, location: "Spain" }, config);
assert.equal(spainOnly.work_from_zona_oeste, false);
assert.equal(spainOnly.work_after_valencia, true);
const chileFlags = placeFlags({ remote: false, location: "Chile" }, config);
assert.equal(chileFlags.work_from_zona_oeste, false);
assert.equal(chileFlags.work_after_valencia, false);
const buenosAires = placeFlags({ remote: false, location: "Buenos Aires" }, config);
assert.equal(buenosAires.work_from_zona_oeste, true);
assert.equal(buenosAires.work_after_valencia, false);
const bareRemote = placeFlags({ remote: true, location: "Remote" }, config);
assert.equal(bareRemote.work_from_zona_oeste, true);
assert.equal(bareRemote.work_after_valencia, false);
assert.equal(placeFlags({ remote: true, location: "Europe" }, config).work_after_valencia, false);

const origin = config.geography.home;
assert.equal(origin.municipality, null);
assert.equal(commute(origin, { name: "Buenos Aires" }).status, "unknown");
assert.equal(commute(origin, { name: "Buenos Aires" }).km, null);
assert.equal(commute(origin, { id: "9", name: null, unresolved_only: true }).status, "unknown");
assert.equal(commute(origin, { name: "Argentina", country_only: true }).status, "unknown");
assert.equal(commute(origin, { name: "Valencia", daily: false }).status, "not_a_daily_commute");
assert.equal(commute({ municipality: "publicado" }, { name: "Santiago", distance_km: 12 }).km, 12);
const valenciaTrip = explainCommute(
  { remote: false, location: "Valencia, Spain", title: "Backend" },
  config,
  { work_from_zona_oeste: false, work_after_valencia: true }
);
assert.equal(valenciaTrip.km, null);
assert.equal(valenciaTrip.status, "not_a_daily_commute");

const venue = publishedVenue({
  location_cities: {
    data: [
      { id: "1", attributes: { name: "Santiago", country: "Chile" } },
      { id: "9" }
    ]
  },
  location_tenants: {
    data: [
      { id: "3", attributes: { name: "Mexico" } },
      { id: "4" }
    ]
  }
});
assert.equal(venue.cities[0].name, "Santiago");
assert.equal(venue.cities[0].country, "Chile");
assert.deepEqual(venue.unresolved_ids, ["9", "4"]);
assert.equal(venueLocation(venue, []), "Santiago, Chile");
const remoteLocal = publishedVenue({
  location_tenants: {
    data: [
      { id: "1", attributes: { name: "Mexico" } },
      { id: "2", attributes: { name: "Costa Rica" } },
      { id: "3", attributes: { name: "Colombia" } }
    ]
  }
});
assert.equal(venueLocation(remoteLocal, []), "Mexico, Costa Rica, Colombia");
assert.equal(venueLocation(remoteLocal, []).includes("9"), false);

const floor = floorFromConstraints(careerModel.constraints);
assert.equal(floor.amount, 1000000);
assert.equal(floor.currency, "ARS");
assert.equal(floor.period, "monthly");
assert.equal(floor.gross_or_net, "unknown");
assert.equal(careerModel.constraints.relocation.move_window, "unknown");
assert.equal(config.geography.relocation.move_window, "unknown");
const arsMonthly = compareSalary(parseSalary("1500000 ARS / monthly", "listing"), floor);
assert.equal(arsMonthly.status, "compared");
assert.equal(arsMonthly.relation, "above");
assert.equal(arsMonthly.gross_or_net, "unknown");
const arsYearly = compareSalary(parseSalary("12000000 pesos argentinos / yearly", "listing"), floor);
assert.equal(arsYearly.status, "compared");
assert.equal(arsYearly.relation, "meets");
const usd = compareSalary(parseSalary("115600-170000 USD / yearly", "listing"), floor);
assert.equal(usd.status, "incomparable");
const eur = compareSalary(parseSalary("40000-60000 EUR / annual", "listing"), floor);
assert.equal(eur.status, "incomparable");
const unlabeled = compareSalary(parseSalary("3000-4400", "getonboard"), floor);
assert.equal(unlabeled.status, "incomparable");
assert.equal(parseSalary("1200000 ARS bruto / monthly").gross_or_net, "unknown");

assert.equal(classifySap("Senior SAP FICO Consultant", "sap fico"), "sap_functional");
assert.equal(classifySap("SAP BTP Developer", "integration suite and sap apis"), "sap_technical");
assert.equal(classifySap("SAP Consultant", "sap module rollout"), "sap_functional");
const btp = evaluate({
  title: "SAP BTP Developer",
  description: "Build on SAP BTP and Integration Suite.",
  mandatory_requirements: ["typescript and node.js", "postgresql"],
  location: "Worldwide",
  remote: true,
  employment_type: "contract",
  salary: "2000 USD / monthly"
});
assert.equal(btp.sap_kind, "sap_technical");
assert.ok(btp.gaps.some(gap => gap.term === "producto SAP"));
assert.equal(btp.retain, true);
assert.equal(btp.salary_comparison, "incomparable");
const btpSpain = evaluate({
  title: "SAP BTP Developer",
  description: "SAP BTP and Integration Suite in Madrid. earliest start 2027-03-01 must start before 2027-06-01",
  mandatory_requirements: ["typescript", "postgresql"],
  location: "Spain",
  remote: true,
  employment_type: "full_time"
});
assert.equal(btpSpain.sap_kind, "sap_technical");
assert.equal(btpSpain.work_from_zona_oeste, false);
assert.equal(btpSpain.work_after_valencia, true);
assert.equal(btpSpain.relocation_watch, true);
assert.equal(btpSpain.relocation_value, "not_yet_ordered");
assert.equal(btpSpain.earliest_start, "2027-03-01");
assert.equal(btpSpain.must_start_before, "2027-06-01");
assert.ok(btpSpain.gaps.some(gap => gap.term === "producto SAP"));

const devopsPair = mergeByBlockingKey([
  { company: "Knowmad Mood", title: "Automation & DevOps Engineer", location: "Spain", url: "https://example.com/a", main_score: 60 },
  { company: "Knowmad Mood S.A.", title: "DevOps Engineer", location: "Valencia, Spain", url: "https://example.com/b", main_score: 55 }
], "main_score");
assert.equal(devopsPair.length, 1);
assert.deepEqual(devopsPair[0].merged_urls, ["https://example.com/b"]);
assert.ok(devopsPair[0].listing_identity.url.includes("example.com/a"));
assert.equal(typeof devopsPair[0].listing_identity.title_hash, "string");

const crossBoard = mergeByBlockingKey([
  { company: "Acme", title: "Data Engineer", location: "Spain", url: "https://himalayas.app/jobs/acme", main_score: 40 },
  { company: "Acme", title: "Data Engineer", location: "Spain", url: "https://www.getonbrd.com/jobs/acme", main_score: 42 }
], "main_score");
assert.equal(crossBoard.length, 1);
assert.equal(crossBoard[0].merged_urls.length, 1);

const differentFamily = mergeByBlockingKey([
  { company: "Knowmad Mood", title: "DevOps Engineer", location: "Spain", url: "https://example.com/dev", main_score: 50 },
  { company: "Knowmad Mood", title: "Senior Data Engineer", location: "Spain", url: "https://example.com/data", main_score: 40 },
  { company: "Improving", title: "Full-Stack Developer", location: "Argentina", url: "https://example.com/fs", main_score: 10 },
  { company: "Improving", title: "QA Automation Engineer", location: "Argentina", url: "https://example.com/qa", main_score: 9 }
], "main_score");
assert.equal(differentFamily.length, 4);

const differentCountry = mergeByBlockingKey([
  { company: "Acme", title: "Data Engineer", location: "Spain", url: "https://example.com/es", main_score: 10 },
  { company: "Acme", title: "Data Engineer", location: "Chile", url: "https://example.com/cl", main_score: 10 }
], "main_score");
assert.equal(differentCountry.length, 2);

const watchOrder = shortList([
  { company: "A", title: "Zebra Role", location: "Spain", url: "https://example.com/z", role_families: ["devops"], main_score: 90, potential: { relocation_value: "not_yet_ordered" } },
  { company: "B", title: "Alpha Role", location: "Spain", url: "https://example.com/a", role_families: ["data"], main_score: 10, potential: { relocation_value: "not_yet_ordered" } }
], "main_score", 5, "title");
assert.equal(watchOrder[0].title, "Alpha Role");
assert.equal(watchOrder[1].title, "Zebra Role");

const bridgeFirst = shortList([
  { company: "One", title: "Same Score Remote", location: "Latin America", url: "https://example.com/1", role_families: ["data"], main_score: 70, potential: { place_bridge: false } },
  { company: "Two", title: "Same Score Bridge", location: "Worldwide", url: "https://example.com/2", role_families: ["data"], main_score: 70, potential: { place_bridge: true } }
], "main_score", 2, "score");
assert.equal(bridgeFirst[0].title, "Same Score Bridge");

for (const name of ["remotive", "arbeitnow", "getonboard", "remoteok", "jobicy", "himalayas"]) {
  assert.equal(config.sources[name].enabled, true, name);
}
assert.equal(config.sources.linkedin, undefined);
assert.equal(config.sources.infojobs, undefined);

console.log("radar logic checks passed");
