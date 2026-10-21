import { NextRequest, NextResponse } from "next/server";
import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";

const CALLBACK_PATH = "/api/integrations/tienda-negocio/callback";

/** El cookie HttpOnly exige que el navegador haya iniciado este OAuth. */
export async function GET(request: NextRequest): Promise<Response> {
  const code = request.nextUrl.searchParams.get("code");
  const pending = request.cookies.get("tn_oauth_pending")?.value;
  const redirect = (state: "connected" | "error") => {
    const response = NextResponse.redirect(
      new URL(`/tienda-negocio/sincronizacion?conexion=${state}`, request.url),
    );
    response.cookies.set("tn_oauth_pending", "", {
      path: CALLBACK_PATH,
      maxAge: 0,
      httpOnly: true,
    });
    return response;
  };

  if (!pending || !/^[0-9a-f-]{36}$/i.test(pending) ||
    !code || code.length > 4096) return redirect("error");

  try {
    const api = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
    await api.post("/tienda-negocio/sincronizacion/conexion/completar", { code });
    return redirect("connected");
  } catch {
    return redirect("error");
  }
}
