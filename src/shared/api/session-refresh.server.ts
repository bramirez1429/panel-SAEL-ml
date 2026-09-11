import "server-only";

import { createHash } from "node:crypto";

import type { AuthTokens } from "@/modules/auth/domain/auth.model";
import { refreshResponseSchema } from "@/modules/auth/infrastructure/refresh-response.schema";
import { ApiError } from "./api-error";
import type { HttpClient } from "./http-client.server";

const REFRESH_ENDPOINT = "/auth/refresh";
const refreshesBySession = new Map<string, Promise<AuthTokens>>();

/**
 * Single-flight de refresh por sesión. La clave es un hash efímero: el token
 * HttpOnly no se expone al navegador, logs ni almacenamiento cliente.
 */
export function refreshPanelSession(
  httpClient: Pick<HttpClient, "post">,
  refreshToken: string,
): Promise<AuthTokens> {
  const sessionKey = createHash("sha256").update(refreshToken).digest("base64url");
  const activeRefresh = refreshesBySession.get(sessionKey);
  if (activeRefresh) return activeRefresh;

  const refresh = requestNewTokens(httpClient, refreshToken);
  refreshesBySession.set(sessionKey, refresh);
  void refresh.finally(() => {
    if (refreshesBySession.get(sessionKey) === refresh) refreshesBySession.delete(sessionKey);
  }).catch(() => undefined);
  return refresh;
}

async function requestNewTokens(
  httpClient: Pick<HttpClient, "post">,
  refreshToken: string,
): Promise<AuthTokens> {
  const response = await httpClient.post(
    REFRESH_ENDPOINT,
    { refreshToken },
    { credentials: "include" },
  );
  const validation = refreshResponseSchema.safeParse(response);
  if (!validation.success) {
    throw new ApiError(
      "El backend devolvió una renovación de sesión inválida.",
      "API_INVALID_RESPONSE",
      { cause: validation.error },
    );
  }
  return {
    accessToken: validation.data.accessToken,
    accessTokenExpiresAt: new Date(validation.data.accessTokenExpiresAt),
    refreshToken: validation.data.refreshToken,
    refreshTokenExpiresAt: new Date(validation.data.refreshTokenExpiresAt),
  };
}
