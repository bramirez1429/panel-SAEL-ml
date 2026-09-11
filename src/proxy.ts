import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAMES, getAuthCookieOptions, getExpiredAuthCookieOptions } from "@/modules/auth/infrastructure/session/auth-cookie.config";
import { getApiConfig } from "@/shared/api/api-config";
import { HttpClient } from "@/shared/api/http-client.server";
import { refreshPanelSession } from "@/shared/api/session-refresh.server";

/**
 * Renueva la sesión antes de renderizar rutas privadas cuando el navegador ya
 * dejó de enviar la cookie vencida de access token.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (request.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(AUTH_COOKIE_NAMES.refreshToken)?.value;
  if (!refreshToken) return redirectToLogin(request);

  try {
    const tokens = await refreshPanelSession(new HttpClient(getApiConfig()), refreshToken);
    request.cookies.set(AUTH_COOKIE_NAMES.accessToken, tokens.accessToken);
    request.cookies.set(AUTH_COOKIE_NAMES.refreshToken, tokens.refreshToken);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("cookie", request.cookies.toString());
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.cookies.set(AUTH_COOKIE_NAMES.accessToken, tokens.accessToken, getAuthCookieOptions(tokens.accessTokenExpiresAt));
    response.cookies.set(AUTH_COOKIE_NAMES.refreshToken, tokens.refreshToken, getAuthCookieOptions(tokens.refreshTokenExpiresAt));
    return response;
  } catch {
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/login", request.url));
  const expired = getExpiredAuthCookieOptions();
  response.cookies.set(AUTH_COOKIE_NAMES.accessToken, "", expired);
  response.cookies.set(AUTH_COOKIE_NAMES.refreshToken, "", expired);
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/integraciones/:path*",
    "/pedidos/:path*",
    "/promociones/:path*",
    "/publicaciones/:path*",
    "/tiendanube/:path*",
  ],
};
