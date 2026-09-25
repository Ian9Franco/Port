import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = process.env.PORT_UI_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: true, auth: "disabled" });
  }

  const body = await request.json().catch(() => ({}));
  if (body.secret !== secret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("port_session", secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}
