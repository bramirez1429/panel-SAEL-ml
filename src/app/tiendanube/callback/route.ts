import { NextResponse } from "next/server";
import { getApiConfig } from "@/shared/api/api-config";
import { forwardSetCookies } from "@/shared/api/forward-set-cookie.server";
import { HttpClient } from "@/shared/api/http-client.server";

export async function GET(request: Request): Promise<Response> {
  try {
    const response = await new HttpClient(getApiConfig()).getResponse(`/tiendanube/callback${new URL(request.url).search}`, { cookieHeader: request.headers.get("cookie") ?? undefined });
    const redirect = NextResponse.redirect(new URL("/integraciones?tiendanube=connected", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
    forwardSetCookies(redirect, response);
    return redirect;
  } catch { return NextResponse.redirect(new URL("/integraciones?tiendanube=error", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")); }
}
