import { NextResponse } from "next/server";
import { runRadarRefresh } from "@/lib/port-data";
import { isAuthenticated } from "@/lib/session";

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runRadarRefresh();
    const message =
      result.mode === "github_actions"
        ? "Radar workflow dispatched on GitHub Actions. Refresh in a few minutes."
        : "Local radar finished. Reload the page.";

    return NextResponse.json({ ok: true, ...result, message });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
