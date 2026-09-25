import fs from "node:fs";

const file = process.argv[2] ?? "data/opportunities.json";
const raw = fs.readFileSync(file, "utf8");
const data = JSON.parse(raw);

const scoreFields = [
  "fit",
  "budget_score",
  "clarity",
  "speed",
  "portfolio_value",
  "close_probability"
];

for (const opportunity of data.opportunities ?? []) {
  opportunity.total = scoreFields.reduce((sum, key) => {
    const value = Number(opportunity[key] ?? 0);
    return sum + Math.max(0, Math.min(5, value));
  }, 0);
}

data.opportunities = (data.opportunities ?? []).sort(
  (a, b) => (b.total ?? 0) - (a.total ?? 0)
);

fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
console.log(`Scored ${data.opportunities.length} opportunities in ${file}`);
