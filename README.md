# Port

Private career and opportunity workspace for finding, qualifying and tracking better work.

Port has two parallel tracks:

- **MAIN** — a stronger primary job, full-time or part-time, from zona oeste (Buenos Aires) now: Argentina-compatible remote, or hybrid/on-site in AMBA. The search is cross-field. Growth Engineering is one lens, not the boundary.
- **SIDE** — remote freelance / contract / project work for additional income. Unknown or full-time listings do not take a SIDE slot.

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
- Valencia / Spain as a later move with family, not a generic Europe watchlist

## SIDE

SIDE is stricter:

- remote only
- freelance, contract, project or part-time nature
- should be compatible with having a MAIN job

## Focus

The matcher reads `career/*.json`, not a single job title. Families:

- Core: full-stack, product engineering, automation, integration, applied AI, internal tools
- Adjacent: DevOps/platform, data/analytics, AppSec, solutions/implementation
- Exploratory: SAP technical, cloud, cybersecurity, deeper Java — only when the gap is a tool or an ecosystem, and the gap stays visible

Growth / RevOps and Zapier are lenses over the same evidence. Zapier is not treated as GitHub evidence until a credential URL is confirmed.

Geography:

- Now: zona oeste, Buenos Aires. Commute cost starts there. No municipality is stored.
- Later: Valencia, Spain, with family. Not an immediate move and not a generic EU search.

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
- `applications/` — compiled apply bundles for shortlisted opportunities
- `scripts/compile-application.mjs` — Application Compiler
- `scripts/opportunity-track.mjs` — pipeline status + feedback CLI
- `scripts/tracking.mjs` / `scripts/feedback-loop.mjs` — state merge + rank adjustments
- `reports/pipeline.md` — funnel summary (regenerated each radar run)
- `data/feedback.json` — explicit feedback events and explainable weight tweaks
- `docs/WORKFLOW.md` — manual application workflow
- `docs/RADAR.md` — automated radar documentation
- `scripts/fetch-opportunities.mjs` — automated ingestion and ranking
- `scripts/potential-matcher.mjs` — Potential Matcher v1 (fit, transferability, gaps)
- `scripts/trust-layer.mjs` — listing / company trust heuristics

## Private UI (Next.js)

See [`web/README.md`](web/README.md) for the dashboard (Top Picks, actions, **Run Radar** button).

## Privacy

This repository is intentionally private because it can contain job leads, application strategy and career planning.
