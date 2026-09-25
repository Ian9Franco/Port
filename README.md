# Port

Private career and opportunity workspace for finding, qualifying and tracking better work.

Port is not limited to freelancing. It supports two parallel goals:

- generate extra income through flexible freelance / contract work
- move toward stronger full-time or part-time roles aligned with automation, integrations and full-stack development

## Focus

- Zapier and workflow automation
- APIs and webhooks
- React / Next.js
- Supabase
- AI-assisted workflows
- Growth Engineering / RevOps-adjacent technical work
- Solutions and implementation roles
- Small internal tools
- Scoped debugging and feature work

## Opportunity Radar

A GitHub Actions workflow runs every 8 hours and checks public job APIs.

It currently uses:

- Remotive
- Arbeitnow

The radar normalizes, deduplicates and ranks roles, then updates:

- data/opportunities.json
- reports/latest.md

Configuration lives in config/radar.json.

See docs/RADAR.md for details.

## Repository map

- PROFILE.md — master professional positioning
- TARGETS.md — target role and project criteria
- config/radar.json — search and ranking configuration
- data/opportunities.json — opportunity database
- reports/latest.md — latest readable shortlist
- templates/ — reusable proposal material
- docs/WORKFLOW.md — manual application workflow
- docs/RADAR.md — automated search workflow
- scripts/fetch-opportunities.mjs — automated source ingestion and ranking
- scripts/score-opportunity.mjs — manual scoring utility

## Privacy

This repository is intentionally private because it can contain job leads, client notes, application strategy and career planning.
