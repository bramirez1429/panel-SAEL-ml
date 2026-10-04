import { proxyCatalogRequest } from "./catalogo-proxy";

export const dynamic = "force-dynamic";

export async function GET() {
  return proxyCatalogRequest("", { method: "GET" });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  return proxyCatalogRequest("", { method: "POST", body: formData });
}
