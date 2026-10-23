import { NextRequest, NextResponse } from "next/server";
import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";
import { getTiendaNegocioOAuthOrigin, logTiendaNegocioOAuthError } from "../oauth-origin.server";

const CALLBACK_PATH = "/api/integrations/tienda-negocio/callback";

type CallbackFailure = "session" | "missing_code" | "rejected" | "exchange";

/** Requiere haber iniciado la instalación desde la sesión del panel SAEL. */
export async function GET(request: NextRequest): Promise<Response> {
  let applicationOrigin: string;
  try {
    applicationOrigin = getTiendaNegocioOAuthOrigin();
  } catch (error: unknown) {
    logTiendaNegocioOAuthError("callback", "validating public OAuth origin", error);
    return new NextResponse("No se pudo completar la autorización de Tienda Negocio.", { status: 500 });
  }
  const code = request.nextUrl.searchParams.get("code");
  const pending = request.cookies.get("tn_oauth_pending")?.value;

  const redirect = (state: "connected" | "error", reason?: CallbackFailure) => {
    const target = new URL("/integraciones", applicationOrigin);
    target.searchParams.set("tiendaNegocio", state);
    if (reason) target.searchParams.set("reason", reason);
    const response = NextResponse.redirect(target);
    response.cookies.set("tn_oauth_pending", "", {
      path: CALLBACK_PATH,
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
    return response;
  };

  if (!pending || !/^[0-9a-f-]{36}$/i.test(pending)) {
    return redirect("error", "session");
  }
  if (request.nextUrl.searchParams.has("error")) {
    return redirect("error", "rejected");
  }
  if (!code || code.length > 4096) {
    return redirect("error", "missing_code");
  }

  try {
    const api = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
    await api.post("/tienda-negocio/sincronizacion/conexion/completar", { code });
    return redirect("connected");
  } catch (error: unknown) {
    logTiendaNegocioOAuthError("callback", "exchanging authorization code with backend", error);
    return redirect("error", "exchange");
  }
}
