import { NextResponse } from "next/server";
import { updateOpportunityStatus } from "@/lib/port-data";
import { isAuthenticated } from "@/lib/session";

const ACTION_STATUS: Record<string, string> = {
  shortlist: "shortlisted",
  skip: "skipped",
  reviewing: "reviewing",
  prepared: "prepared",
  applied: "applied",
  interview: "interview",
  lost: "lost"
};

export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "");
  const action = String(body.action ?? "");
  const status = ACTION_STATUS[action] ?? body.status;
  const note = body.note ? String(body.note) : undefined;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (!status || typeof status !== "string") {
    return NextResponse.json({ error: "Missing action or status" }, { status: 400 });
  }

  try {
    const job = await updateOpportunityStatus(id, status, note);
    return NextResponse.json({ ok: true, opportunity: job });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
