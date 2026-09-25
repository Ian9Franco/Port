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

1. Set project **Root Directory** to `web` (not the monorepo root).
2. **Required** environment variables (Production + Preview):

   | Variable | Value |
   |----------|--------|
   | `PORT_DATA_BACKEND` | `github` |
   | `GITHUB_TOKEN` | PAT with `contents:write` + `actions:write` on `Ian9Franco/Port` |
   | `GITHUB_REPOSITORY` | `Ian9Franco/Port` |
   | `PORT_UI_SECRET` | your UI password |

   On Vercel, `PORT_DATA_BACKEND` defaults to `github` automatically (`VERCEL=1`). Without `GITHUB_TOKEN`, the dashboard shows a setup error (build can still succeed).

3. Enable **Vercel Deployment Protection** as an extra layer.

**Run Radar** dispatches the `Opportunity Radar` GitHub Actions workflow. Refresh the UI after the workflow commits new data.

### Build log notes

- `next@15.5.4` deprecation: use **15.5.26+** (patched for CVE-2025-66478).
- Warnings about `eslint` / `install-scripts` are non-fatal on Vercel.

## Scope (MVP A)

- Dashboard + opportunity detail + status actions
- Does **not** duplicate matcher logic — consumes the same JSON as the radar
