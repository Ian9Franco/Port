# Opportunity Radar

Port's radar is a private career-opportunity system. It searches, filters and prepares opportunities, but application remains manual.

## Schedule

GitHub Actions runs every 8 hours at minute 23, three times per day.

The workflow can also be triggered manually from GitHub Actions.

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

Scoring is a triage heuristic, not a claim that a company or role is objectively better.

MAIN and SIDE use different weights because they optimize for different outcomes.

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

That validates the acquisition path, but it does not prove every employer or posting is legitimate. Company-level verification is a separate future layer.

Remote jobs can still have country restrictions. Always confirm the original listing before applying.
