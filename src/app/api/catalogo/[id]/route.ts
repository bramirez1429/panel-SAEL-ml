import { proxyCatalogRequest } from "../catalogo-proxy";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: RouteContext<"/api/catalogo/[id]">) {
  const { id } = await context.params;
  const body = await request.text();
  return proxyCatalogRequest(`/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
