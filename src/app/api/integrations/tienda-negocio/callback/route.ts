import { NextRequest, NextResponse } from "next/server";
import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";

const CALLBACK_PATH = "/api/integrations/tienda-negocio/callback";

type CallbackFailure = "session" | "missing_code" | "rejected" | "exchange";

/** Requiere haber iniciado la instalación desde la sesión del panel SAEL. */
export async function GET(request: NextRequest): Promise<Response> {
  const code = request.nextUrl.searchParams.get("code");
  const pending = request.cookies.get("tn_oauth_pending")?.value;

  const redirect = (state: "connected" | "error", reason?: CallbackFailure) => {
    const target = new URL("/integraciones", request.url);
    target.searchParams.set("tiendaNegocio", state);
    if (reason) target.searchParams.set("reason", reason);
    const response = NextResponse.redirect(target);
    response.cookies.set("tn_oauth_pending", "", {
      path: CALLBACK_PATH,
      maxAge: 0,
      httpOnly: true,
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
  } catch {
    return redirect("error", "exchange");
  }
}
