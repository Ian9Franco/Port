# Opportunity Radar

Port's radar is a private career-opportunity system. It searches, filters and prepares opportunities, but application remains manual.

## Schedule

GitHub Actions runs every 8 hours at minute 23, three times per day (UTC).

The workflow can also be triggered manually from GitHub Actions (**Run workflow** on `Opportunity Radar`).

### First run / troubleshooting

- Scheduled workflows only run on the repository **default branch** (`main`). After merging the workflow, wait for the next cron slot or use **workflow_dispatch**.
- GitHub may delay the first scheduled run on a new workflow until the next cron boundary.
- The job needs `contents: write` so `github-actions[bot]` can commit refreshed JSON and reports. If **branch protection** blocks direct pushes, either allow the Actions bot to bypass protection or download the `radar-output-*` artifact from the failed run.
- Partial source outages are expected: each API is fetched independently. Transient HTTP errors are retried; failures are recorded in `source_failures` inside `data/opportunities.json` without aborting the whole run (unless every source fails).

### Local run

```bash
node --check scripts/fetch-opportunities.mjs
node scripts/fetch-opportunities.mjs
```

## Tracks

### MAIN

For a primary job.

Allowed:
- full-time
- part-time
- contract when it behaves like a stable role
- remote from Argentina
- local hybrid / on-site roles in Buenos Aires / CABA / GBA when reasonable
- Europe / Spain as a separate relocation watchlist

The report shows at most 3 MAIN Top Picks per run.

### SIDE

For secondary income.

Allowed:
- freelance
- project / contract work
- part-time
- commission-oriented work when technically relevant

SIDE must be remote.

The report shows at most 3 SIDE Top Picks per run.

## Sources

### Remotive

Public remote-jobs API.

### Arbeitnow

Public job-board API. The radar uses remote listings.

### Get on Board

Public API. The radar reads category feeds for:
- programming
- machine-learning-ai
- operations-management

Get on Board is especially useful for Latin America and can surface both remote roles and geographically relevant local roles.

### RemoteOK

Public JSON API (`remoteok.com/api`). Attribution link to [RemoteOK](https://remoteok.com) is required by their API terms.

### Jobicy

Public JSON API for remote roles (`jobicy.com/api/v2/remote-jobs`). Credit [Jobicy](https://jobicy.com) when sharing listings.

## Outputs

The radar writes:

- `data/opportunities.json` — machine-readable database and status state
- `reports/latest.md` — only the strongest MAIN and SIDE picks
- `reports/all-candidates.md` — the wider curated universe
- `reports/application-prep.md` — CV / intro tailoring notes for Top Picks

## Why there are two layers

The algorithm should focus your attention without hiding its work.

`latest.md` is intentionally short.

`all-candidates.md` exists so you can still inspect jobs the scoring system did not rank in the top three.

## Application preparation

For each Top Pick, the radar extracts recognizable requirement terms.

It separates:

- terms already supported by the working profile and worth emphasizing
- terms found in the listing that should be verified before being claimed

This is intentionally conservative. Port must not invent years of experience, technologies, credentials or results.

## Application policy

Current mode: **manual**.

Port may:
- find jobs
- rank jobs
- preserve links
- prepare CV / intro notes
- track application status

Port does not automatically submit applications.

## Scoring

**Potential Matcher v1** ranks opportunities using evidence from `career/*.json`:

- **Current Fit** — how much of the listing maps to direct profile evidence today
- **Transferability** — overlap when exact tools differ but capabilities transfer
- **Gap Cost** — low / medium / high (tool, ecosystem, operational, fundamental gaps)
- **Evidence Confidence** — how defendible the match is
- **Career Potential** — transition value (including DevOps, Cloud, Data, SAP-adjacent paths)
- **Relocation Value**, **Compensation Fit**, **Workstyle Fit**, **Commute Burden**

Each retained job stores `potential.reasons` and `potential.gaps` in `data/opportunities.json`. Keyword scoring remains as a legacy signal (`keyword_main_score` / `keyword_side_score` internally).

MAIN and SIDE ranks use different weights because they optimize for different outcomes.

## Status preservation

These states are preserved between runs:

- new
- shortlisted
- applied
- replied
- interview
- won
- lost
- skipped

Applied, replied, interview and won records are protected from automatic pruning.

## Trust and limitations

The current automated sources are API-based rather than browser scraping.

That validates the acquisition path, but it does not prove every employer or posting is legitimate.

### Listing trust layer (v1)

Each opportunity includes:

```text
SOURCE TRUST: official_public_api (channel)
COMPANY TRUST: low | medium
LISTING RISK: low | unknown | medium | high
```

Heuristics include board URL consistency, ATS/careers links, short descriptions, salary outliers, scam-pattern phrases, gambling industry, and duplicate title/company clusters. **High risk** lowers rank; it does not auto-delete listings.

Remote jobs can still have country restrictions. Always confirm the original listing before applying.
