# Port

Private workspace for finding, qualifying and tracking remote freelance work.

The initial focus is work that fits around an existing part-time role and makes use of automation, integrations and full-stack development skills.

## Focus

- Zapier automation
- APIs and webhooks
- React / Next.js
- Supabase
- AI-assisted workflows
- Small internal tools
- Debugging and scoped feature work

## Repository map

- `PROFILE.md` — positioning, skills and proof
- `TARGETS.md` — target project types and qualification rules
- `data/opportunities.json` — opportunity database
- `templates/` — reusable proposal material
- `docs/WORKFLOW.md` — operating process
- `scripts/score-opportunity.mjs` — simple lead scoring utility

## Basic usage

Add leads to `data/opportunities.json`, score them, shortlist the strongest opportunities and prepare a tailored proposal.

```bash
node scripts/score-opportunity.mjs data/opportunities.json
```

This repository is intentionally private because it may contain job leads, client notes and application strategy.
