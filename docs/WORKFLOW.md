# Workflow

## 1. Capture

Add each interesting lead to `data/opportunities.json`.

Suggested fields:

```json
{
  "id": "source-001",
  "source": "Upwork",
  "url": "",
  "title": "",
  "client": "",
  "description": "",
  "budget": "",
  "fit": 0,
  "budget_score": 0,
  "clarity": 0,
  "speed": 0,
  "portfolio_value": 0,
  "close_probability": 0,
  "total": 0,
  "status": "new",
  "notes": ""
}
```

## 2. Score

The **Opportunity Radar** (`node scripts/fetch-opportunities.mjs`) scores MAIN/SIDE automatically and writes `data/opportunities.json`.

For legacy manual leads that still use the older numeric rubric (`fit`, `budget_score`, …), run:

```bash
node scripts/score-opportunity.mjs data/opportunities.json
```

## 3. Qualify

For high-scoring leads:

- identify the actual business outcome
- estimate the smallest useful scope
- identify access or technical risks
- prepare a tailored proposal
- avoid generic copy-paste applications

## 4. Shortlist → Application Compiler

When an opportunity `status` is **`shortlisted`** or **`prepared`**, the radar (or manual CLI) generates:

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

Automatic: every successful radar run refreshes bundles for shortlisted rows.

Manual:

```bash
node scripts/compile-application.mjs
node scripts/compile-application.mjs <opportunity-id>   # one-off compile (ignores status)
```

The compiler adapts emphasis and ordering only — it must not invent employers, years, or tools.

## 5. Apply

Use the templates as a base, but rewrite the first paragraph and implementation plan for every opportunity.

## 6. Track

Statuses (`config/tracking.json`):

```text
new → reviewing → shortlisted → prepared → applied → replied → interview → offer → won
                                                      ↘ lost / skipped
```

CLI:

```bash
node scripts/opportunity-track.mjs status <id> shortlisted --cv applications/.../cv.md --note "..."
node scripts/opportunity-track.mjs feedback <id> shortlist --note "esto sí"
node scripts/opportunity-track.mjs report
```

Signals for feedback (`data/feedback.json`): `skip`, `reject`, `save`, `shortlist`, `apply`, `interview`, `offer`, `won`. Adjustments are damped and explained — one event does not permanently rewrite the matcher.

Each opportunity stores `tracking.cv_used`, `tracking.contact`, `tracking.salary_offered`, `tracking.feedback`, `tracking.applied_at`, and `tracking.history[]`.

## 7. Learn

For every reply or rejection, capture what changed:

- price
- proposal angle
- platform
- project type
- client size
- response time

The goal is to learn which type of work closes fastest and pays best for the available time.
