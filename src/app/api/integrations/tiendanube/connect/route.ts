import { NextResponse } from "next/server";
import { createTiendanubeApiRepository } from "@/modules/integrations/integrations.composition.server";
import { forwardSetCookies } from "@/shared/api/forward-set-cookie.server";

export async function GET(): Promise<Response> {
  try {
    const authorization = await createTiendanubeApiRepository().getAuthorizationRequest();
    const response = NextResponse.redirect(new URL(authorization.url));
    forwardSetCookies(response, authorization.response);
    return response;
  } catch { return NextResponse.redirect(new URL("/integraciones?tiendanube=error", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")); }
}
