import { NextResponse } from "next/server";

import { getApiConfig } from "@/shared/api/api-config";
import { forwardSetCookies } from "@/shared/api/forward-set-cookie.server";
import { HttpClient } from "@/shared/api/http-client.server";

/**
 * Proxy server-side del callback OAuth: conserva el browser-binding HttpOnly
 * y evita exponer respuestas internas de Nest al navegador.
 */
export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const code = readQueryValue(requestUrl.searchParams.get("code"));
  const state = readQueryValue(requestUrl.searchParams.get("state"));

  if (!code || !state) return redirectToError();

  try {
    const query = new URLSearchParams({ code, state });
    const backendResponse = await new HttpClient(getApiConfig()).getResponse(
      `/tiendanube/callback?${query.toString()}`,
      { cookieHeader: request.headers.get("cookie") ?? undefined },
    );
    const redirect = NextResponse.redirect(
      new URL("/integraciones?tiendanube=connected", getApplicationOrigin()),
    );
    forwardSetCookies(redirect, backendResponse);
    return redirect;
  } catch {
    return redirectToError();
  }
}

function readQueryValue(value: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function redirectToError(): Response {
  return NextResponse.redirect(
    new URL("/integraciones?tiendanube=error", getApplicationOrigin()),
  );
}

function getApplicationOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
