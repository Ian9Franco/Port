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

Run:

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

## 4. Apply

Use the templates as a base, but rewrite the first paragraph and implementation plan for every opportunity.

## 5. Track

Suggested statuses:

- new
- shortlisted
- applied
- replied
- interview
- won
- lost
- skipped

## 6. Learn

For every reply or rejection, capture what changed:

- price
- proposal angle
- platform
- project type
- client size
- response time

The goal is to learn which type of work closes fastest and pays best for the available time.
