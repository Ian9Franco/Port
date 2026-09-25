# Port

Private career and opportunity workspace for finding, qualifying and tracking better work.

Port has two parallel tracks:

- **MAIN** — a stronger primary job, full-time or part-time, preferably aligned with development, automation, integrations, Growth Engineering or adjacent technical work
- **SIDE** — remote freelance / contract / project work for additional income

Application remains manual: Port does the search and preparation work; Ian makes the final decision and applies.

## Opportunity Radar

A GitHub Actions workflow runs every 8 hours.

Current API sources:

- Remotive
- Arbeitnow
- Get on Board
- RemoteOK
- Jobicy

The radar:

1. fetches current listings
2. normalizes and deduplicates them
3. evaluates relevance to the working profile
4. scores MAIN and SIDE separately
5. keeps a wider candidate universe
6. exposes only the strongest Top Picks in the short report
7. prepares conservative CV / intro tailoring notes

## Outputs

- `data/opportunities.json` — complete working database
- `reports/latest.md` — max 3 MAIN + 3 SIDE Top Picks
- `reports/all-candidates.md` — wider curated universe
- `reports/application-prep.md` — tailoring notes for Top Picks

## MAIN

MAIN accepts:

- full-time
- part-time
- selected contract roles
- remote work compatible with Argentina
- hybrid / on-site roles around Buenos Aires, CABA or GBA
- Spain / Europe as a separate relocation watchlist

## SIDE

SIDE is stricter:

- remote only
- freelance, contract, project or part-time nature
- should be compatible with having a MAIN job

## Focus

- Zapier and workflow automation
- APIs and webhooks
- React / Next.js
- Supabase
- AI-assisted workflows
- Growth Engineering / RevOps-adjacent technical work
- Solutions and implementation roles
- internal tools
- scoped debugging and feature work

## Repository map

- `PROFILE.md` — master professional positioning (human summary)
- `TARGETS.md` — MAIN / SIDE target criteria (human summary)
- `career/*.json` — canonical structured career model for the matcher
- `scripts/load-career-model.mjs` — loads career JSON for the radar
- `config/radar.json` — scoring and source configuration
- `data/opportunities.json` — opportunity database
- `reports/latest.md` — short recommendation layer
- `reports/all-candidates.md` — full curated layer
- `reports/application-prep.md` — application preparation
- `templates/` — proposal material
- `docs/WORKFLOW.md` — manual application workflow
- `docs/RADAR.md` — automated radar documentation
- `scripts/fetch-opportunities.mjs` — automated ingestion and ranking
- `scripts/potential-matcher.mjs` — Potential Matcher v1 (fit, transferability, gaps)
- `scripts/trust-layer.mjs` — listing / company trust heuristics

## Privacy

This repository is intentionally private because it can contain job leads, application strategy and career planning.
