const catalogBaseUrl = (process.env.NEXT_PUBLIC_CATALOG_API_URL ?? "https://saeltendencia.store").replace(/\/$/, "");

export async function proxyCatalogRequest(path: string, init: RequestInit): Promise<Response> {
  try {
    const response = await fetch(`${catalogBaseUrl}/api/admin/catalogo${path}`, {
      ...init,
      cache: "no-store",
    });
    const body = await response.arrayBuffer();
    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    return new Response(body, { status: response.status, headers });
  } catch {
    return Response.json(
      { message: "No se pudo conectar con el catálogo externo." },
      { status: 502 },
    );
  }
}
