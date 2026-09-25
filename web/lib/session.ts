import { cookies } from "next/headers";

export function isAuthEnabled(): boolean {
  return Boolean(process.env.PORT_UI_SECRET);
}

export async function isAuthenticated(): Promise<boolean> {
  const secret = process.env.PORT_UI_SECRET;
  if (!secret) return true;
  const store = await cookies();
  return store.get("port_session")?.value === secret;
}
