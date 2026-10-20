import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { loadCareerModel } from "./load-career-model.mjs";
import { evaluatePotential } from "./potential-matcher.mjs";
import { normalizeEmployment, confirmedSideNature } from "./employment.mjs";
import { classifyAccess } from "./geography.mjs";
import { collapseNearDuplicates } from "./role-dedupe.mjs";
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
assert.ok(valencia.relocation_value > 70, "valencia relocation value " + valencia.relocation_value);

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
assert.equal(freelance.side_eligible, true);

const collapsed = collapseNearDuplicates([
  { company: "ElevenLabs", title: "Full-Stack Engineer - Creative Agents", main_score: 70 },
  { company: "ElevenLabs", title: "Full-Stack Engineer (Backend Leaning) - Creative Agents", main_score: 68 },
  { company: "Other", title: "Data Engineer", main_score: 60 }
], "main_score");
assert.equal(collapsed.length, 2);

if (config.roles.keyword_score_gates_retention !== false) fail("keyword score still gates retention");

console.log("radar logic checks passed");
