import { NextResponse } from "next/server";

import { getApiConfig } from "@/shared/api/api-config";
import { forwardSetCookies } from "@/shared/api/forward-set-cookie.server";
import { HttpClient } from "@/shared/api/http-client.server";

export async function GET(request: Request): Promise<Response> {
  const incomingUrl = new URL(request.url);
  const query = incomingUrl.search;
  try {
    const response = await new HttpClient(getApiConfig()).getResponse(
      `/mercadolibre/callback${query}`,
      { cookieHeader: request.headers.get("cookie") ?? undefined },
    );
    const redirect = NextResponse.redirect(
      new URL("/integraciones?mercadolibre=connected", getApplicationOrigin()),
    );
    forwardSetCookies(redirect, response);
    return redirect;
  } catch {
    return NextResponse.redirect(
      new URL("/integraciones?mercadolibre=error", getApplicationOrigin()),
    );
  }
}

function getApplicationOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
