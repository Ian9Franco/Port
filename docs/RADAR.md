# Opportunity Radar

The radar turns this repository into a lightweight career and freelance opportunity tracker.

## Schedule

GitHub Actions runs it every 8 hours at minute 23, which is three runs per day.

The workflow can also be triggered manually from GitHub Actions.

## Sources

### Remotive

Uses the public remote-jobs API. Every retained result keeps its original Remotive URL and identifies Remotive as the source. Three scheduled runs per day stays within Remotive's guidance to fetch only a few times daily.

### Arbeitnow

Uses the public job-board API with no API key. The radar checks the first three pages and keeps remote listings.

## What the radar does

1. Fetches current listings.
2. Normalizes them into one schema.
3. Scores role relevance from the profile configuration.
4. Classifies location as remote-now, relocation-watch, or restricted-or-unclear.
5. Deduplicates listings.
6. Preserves application status and notes from previous runs.
7. Keeps recent, relevant opportunities.
8. Writes data/opportunities.json and reports/latest.md.

## What the score means

The score is a triage heuristic. It is not a verdict on the quality of the company or role.

Current high-signal terms include Zapier, automation, integrations, workflows, APIs, Supabase, React/Next.js, full-stack work, Growth Engineering, RevOps and related implementation work.

Edit config/radar.json to tune the search without changing code.

## Application statuses

These can be edited manually and are preserved across refreshes:

- new
- shortlisted
- applied
- replied
- interview
- won
- lost
- skipped

Applied, replied, interview and won records are protected from automatic pruning.

## Limitations

LinkedIn is not scraped by this workflow. LinkedIn access should use authorized integrations rather than browser scraping or session cookies.

Some job boards impose geographic restrictions even on remote roles. Always confirm the original listing before applying.
