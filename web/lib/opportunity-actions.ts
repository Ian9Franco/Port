export const OPPORTUNITY_ACTIONS = [
  { action: "reviewing", status: "reviewing", label: "Reviewing" },
  { action: "shortlist", status: "shortlisted", label: "Shortlist" },
  { action: "prepared", status: "prepared", label: "Prepared" },
  { action: "applied", status: "applied", label: "Applied" },
  { action: "skip", status: "skipped", label: "Skip" },
  { action: "lost", status: "lost", label: "Lost" }
] as const;

export const ACTION_STATUS: Record<string, string> = {
  ...Object.fromEntries(OPPORTUNITY_ACTIONS.map(item => [item.action, item.status])),
  interview: "interview"
};
