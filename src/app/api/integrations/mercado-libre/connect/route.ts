import { NextResponse } from "next/server";

import { createMercadoLibreApiRepository } from "@/modules/integrations/integrations.composition.server";
import { forwardSetCookies } from "@/shared/api/forward-set-cookie.server";

export async function GET(): Promise<Response> {
  try {
    const authorization =
      await createMercadoLibreApiRepository().getAuthorizationRequest();
    const destination = new URL(authorization.url);
    const response = NextResponse.redirect(destination);
    forwardSetCookies(response, authorization.response);
    return response;
  } catch {
    return NextResponse.redirect(new URL("/integraciones?mercadolibre=error", getApplicationOrigin()));
  }
}

function getApplicationOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
