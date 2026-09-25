# Port — Private UI

Next.js dashboard for MAIN/SIDE picks, opportunity detail, pipeline actions, and **Run Opportunity Radar**.

## Local development

From repository root:

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

- **Data:** `PORT_DATA_BACKEND=local` reads `../data/opportunities.json`
- **Radar button:** runs `node scripts/fetch-opportunities.mjs` in the repo root (may take ~1–3 min)
- **Actions:** PATCH status directly into `data/opportunities.json` (shortlist triggers Application Compiler on next radar run; run radar after shortlist to refresh bundles, or use CLI)

## Vercel deployment

1. Set project **Root Directory** to `web`.
2. Environment variables:
   - `PORT_DATA_BACKEND=github`
   - `GITHUB_TOKEN` — fine-grained or classic PAT with `contents:write` and `actions:write`
   - `GITHUB_REPOSITORY=Ian9Franco/Port`
   - `PORT_UI_SECRET` — private access password
3. Enable **Vercel Deployment Protection** as an extra layer.

**Run Radar** dispatches the `Opportunity Radar` GitHub Actions workflow. Refresh the UI after the workflow commits new data.

## Scope (MVP A)

- Dashboard + opportunity detail + status actions
- Does **not** duplicate matcher logic — consumes the same JSON as the radar
