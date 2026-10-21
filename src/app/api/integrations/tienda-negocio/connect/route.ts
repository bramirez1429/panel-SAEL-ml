import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";

export async function GET(request: Request): Promise<Response> {
  try {
    const api = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
    const result = await api.get("/tienda-negocio/sincronizacion/conexion/iniciar");
    if (!isRecord(result) || typeof result.url !== "string") throw new Error("Invalid URL");
    const url = new URL(result.url);
    if (url.protocol !== "https:" || url.hostname !== "panel.tiendanegocio.com") {
      throw new Error("Invalid Tienda Negocio domain");
    }
    const response = NextResponse.redirect(url);
    response.cookies.set("tn_oauth_pending", randomUUID(), {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/api/integrations/tienda-negocio/callback",
      maxAge: 60,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/integraciones?tiendaNegocio=error", request.url));
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
