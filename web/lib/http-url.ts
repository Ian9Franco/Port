const HTTP_PROTOCOL = /^https?:$/;

export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!HTTP_PROTOCOL.test(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function hostnameOf(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}
