import "server-only";

import { getAccessToken } from "@/modules/auth/infrastructure/session/auth-session.server";
import { AppError } from "@/shared/errors/app-error";
import type { HttpClient } from "./http-client.server";
import type { AuthenticatedRequestOptions } from "./authenticated-http-client.server";

export type AuthenticatedMultipartHttpClient = Readonly<{
  postMultipart(
    path: string,
    body: FormData,
    options?: AuthenticatedRequestOptions,
  ): Promise<unknown>;
}>;

export function createAuthenticatedMultipartHttpClient(
  httpClient: Pick<HttpClient, "postMultipart">,
): AuthenticatedMultipartHttpClient {
  return {
    postMultipart: async (path, body, options) => {
      const token = await getAccessToken();
      if (!token) {
        throw new AppError(
          "La sesión autenticada es necesaria para esta operación.",
          "AUTHENTICATION_REQUIRED",
        );
      }
      return httpClient.postMultipart(path, body, {
        ...options,
        bearerToken: token,
      });
    },
  };
}
