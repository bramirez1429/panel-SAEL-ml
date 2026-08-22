import "server-only";

import type { HttpResponse } from "./http-client.server";

/** Conserva cookies HttpOnly emitidas por Nest al pasar por un Route Handler. */
export function forwardSetCookies(
  response: Response,
  backendResponse: HttpResponse,
): void {
  const headers = backendResponse.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const cookies = headers.getSetCookie?.() ?? readSingleHeader(headers);

  for (const cookie of cookies) {
    response.headers.append("set-cookie", cookie);
  }
}

function readSingleHeader(headers: Headers): string[] {
  const value = headers.get("set-cookie");
  return value ? [value] : [];
}
