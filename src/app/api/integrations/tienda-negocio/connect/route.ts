import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";
import { getTiendaNegocioOAuthOrigin, logTiendaNegocioOAuthError } from "../oauth-origin.server";

export async function GET(): Promise<Response> {
  let operation = "validating public OAuth origin";
  try {
    getTiendaNegocioOAuthOrigin();
    operation = "creating authenticated backend client";
    const api = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
    operation = "requesting Tienda Negocio authorization URL";
    const result = await api.get("/tienda-negocio/sincronizacion/conexion/iniciar");
    operation = "validating Tienda Negocio authorization URL";
    if (!isRecord(result) || typeof result.url !== "string") throw new Error("Invalid URL");
    const url = new URL(result.url);
    if (url.protocol !== "https:" || url.hostname !== "panel.tiendanegocio.com") {
      throw new Error("Invalid Tienda Negocio domain");
    }
    const response = NextResponse.redirect(url);
    response.cookies.set("tn_oauth_pending", randomUUID(), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/integrations/tienda-negocio/callback",
      maxAge: 10 * 60,
    });
    return response;
  } catch (error: unknown) {
    logTiendaNegocioOAuthError("connect", operation, error);
    const applicationOrigin = tryGetApplicationOrigin();
    if (!applicationOrigin) {
      return new NextResponse("No se pudo iniciar la autorización de Tienda Negocio.", { status: 500 });
    }
    return NextResponse.redirect(new URL("/integraciones?tiendaNegocio=error&reason=start", applicationOrigin));
  }
}

function tryGetApplicationOrigin(): string | null {
  try {
    return getTiendaNegocioOAuthOrigin();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
