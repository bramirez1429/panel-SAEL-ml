const catalogBaseUrl = (process.env.NEXT_PUBLIC_CATALOG_API_URL ?? "https://saeltendencia.store").replace(/\/$/, "");

export async function proxyCatalogRequest(path: string, init: RequestInit): Promise<Response> {
  const catalogAdminToken = process.env.CATALOG_ADMIN_TOKEN;
  const headers = new Headers(init.headers);
  if (catalogAdminToken) {
    headers.set("Authorization", `Bearer ${catalogAdminToken}`);
  }

  try {
    const response = await fetch(`${catalogBaseUrl}/api/admin/catalogo${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
    const body = await response.arrayBuffer();
    const responseHeaders = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) responseHeaders.set("Content-Type", contentType);
    return new Response(body, { status: response.status, headers: responseHeaders });
  } catch {
    return Response.json(
      { message: "No se pudo conectar con el catálogo externo." },
      { status: 502 },
    );
  }
}
