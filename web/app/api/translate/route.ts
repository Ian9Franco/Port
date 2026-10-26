import { utf8Bytes } from "@/lib/text-chunks";

const SOURCES = new Set(["en", "de", "pt", "fr", "it"]);

function shortError(detail: string): string {
  if (/quota|daily limit|available free/i.test(detail)) return "Se agotó el cupo gratuito de MyMemory.";
  if (/query length|length limit/i.test(detail)) return "El fragmento supera el límite de MyMemory.";
  return "MyMemory no devolvió una traducción.";
}

export async function POST(request: Request) {
  let body: { text?: unknown; sourceLang?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Pedido inválido." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const sourceLang = typeof body.sourceLang === "string" && SOURCES.has(body.sourceLang) ? body.sourceLang : "en";
  if (!text) return Response.json({ ok: false, error: "No hay texto para traducir." }, { status: 400 });
  if (utf8Bytes(text) > 480) {
    return Response.json({ ok: false, error: "El fragmento supera el límite de MyMemory." }, { status: 400 });
  }

  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${sourceLang}|es`);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(8000)])
    });
    if (!response.ok) {
      return Response.json({ ok: false, error: "MyMemory no respondió." });
    }
    const data = await response.json() as {
      responseData?: { translatedText?: unknown };
      responseStatus?: number;
      responseDetails?: unknown;
    };
    const translated = data.responseData?.translatedText;
    const detail = typeof data.responseDetails === "string" ? data.responseDetails : "";
    const warning = typeof translated === "string" ? translated : "";
    if (!warning.trim() || data.responseStatus !== 200 || /MYMEMORY WARNING|QUERY LENGTH/i.test(warning)) {
      return Response.json({ ok: false, error: shortError(detail || warning) });
    }
    return Response.json({ ok: true, translation: warning });
  } catch {
    return Response.json({ ok: false, error: "MyMemory no respondió." });
  }
}
