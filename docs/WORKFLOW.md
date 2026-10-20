# Workflow

Port prepares. Ian decides. Nothing in this repo submits an application.

The only writer of `data/opportunities.json` is the Opportunity Radar:

```bash
node scripts/fetch-opportunities.mjs
```

`scripts/score-opportunity.mjs` is retired. It exits without touching the database. The old freelance rubric (`fit`, `budget_score`, `clarity`, `speed`) is not part of the ranking.

## 1. Radar

Each run:

1. fetches Remotive, Arbeitnow, Get on Board, RemoteOK, Jobicy, and Himalayas
2. classifies place: Argentina-compatible remote, AMBA/Argentina on-site, Valencia/Spain later, or out of scope
3. scores with the Potential Matcher against `career/*.json`
4. keeps a wider universe and writes at most 3 MAIN and 3 SIDE picks
5. writes a Valencia/Spain relocation watch that is not a current move and not generic Europe

Keyword overlap does not put a job into the universe or the short list.

## 2. Read

- `reports/latest.md` — short list, with evidence sources, gaps, seniority, and salary next to the unconfirmed floor
- `reports/all-candidates.md` — the rest of the curated set
- `reports/application-prep.md` — what to emphasize and what is still unknown
- the private UI in `web/` reads the same JSON

On-site Chile (and other countries) are not kept as if they were a commute from zona oeste.

## 3. Decide

Statuses in `config/tracking.json`:

```text
new → reviewing → shortlisted → prepared → applied → replied → interview → offer → won
                                                      ↘ lost / skipped
```

```bash
node scripts/opportunity-track.mjs status <id> shortlisted --cv applications/.../cv.md --note "..."
node scripts/opportunity-track.mjs feedback <id> shortlist --note "esto sí"
node scripts/opportunity-track.mjs report
```

One note does not permanently rewrite the matcher. A test event must not be left in `data/feedback.json`.

## 4. Prepare

When status is `shortlisted` or `prepared`, the radar writes:

```text
applications/<company-role>/
  opportunity.md
  fit-analysis.md
  gaps.md
  cv.md
  intro.md
  cover-letter.md
  interview-prep.md
```

```bash
node scripts/compile-application.mjs
node scripts/compile-application.mjs <opportunity-id>
```

The compiler changes order and emphasis. It does not add employers, years, or tools.

## 5. Apply

Rewrite the opening for the specific listing. Use the original URL. For Himalayas, use the application link stored on the row.
