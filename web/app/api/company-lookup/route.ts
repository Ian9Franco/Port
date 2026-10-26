import { lookupPublicCompany } from "@/lib/public-company";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = (url.searchParams.get("name") ?? "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 160);
  if (name.length < 2) {
    return Response.json({
      ok: true,
      matched: false,
      message: "El aviso no trae un nombre de empresa para buscar."
    });
  }

  try {
    const result = await lookupPublicCompany(name);
    return Response.json(result);
  } catch {
    return Response.json({ ok: false, error: "No se pudo consultar la ficha pública." });
  }
}
