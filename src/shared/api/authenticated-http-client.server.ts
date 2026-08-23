import "server-only";

import { getAccessToken } from "@/modules/auth/infrastructure/session/auth-session.server";
import { AppError } from "@/shared/errors/app-error";

import type {
  HttpClient,
  HttpResponse,
} from "./http-client.server";

/**
 * Adaptador server-only para requests privados. Lee el access token desde la
 * cookie HttpOnly en cada request y evita repetir esa responsabilidad en cada
 * repository o componente.
 */
export type AuthenticatedHttpClient = Readonly<{
  get(path: string): Promise<unknown>;
  getResponse(path: string): Promise<HttpResponse>;
  post(path: string, body?: unknown): Promise<unknown>;
  postResponse(path: string, body?: unknown): Promise<HttpResponse>;
  patch(path: string, body?: unknown): Promise<unknown>;
  patchResponse(path: string, body?: unknown): Promise<HttpResponse>;
}>;

export function createAuthenticatedHttpClient(
  httpClient: Pick<
    HttpClient,
    "get" | "getResponse" | "post" | "postResponse" | "patch" | "patchResponse"
  >,
): AuthenticatedHttpClient {
  return {
    get: (path) => authenticatedGet(httpClient, path),
    getResponse: (path) => authenticatedGetResponse(httpClient, path),
    post: (path, body) => authenticatedPost(httpClient, path, body),
    postResponse: (path, body) => authenticatedPostResponse(httpClient, path, body),
    patch: (path, body) => authenticatedPatch(httpClient, path, body),
    patchResponse: (path, body) => authenticatedPatchResponse(httpClient, path, body),
  };
}

async function authenticatedGet(
  httpClient: Pick<HttpClient, "get">,
  path: string,
): Promise<unknown> {
  const token = await requireAccessToken();
  return httpClient.get(path, { bearerToken: token });
}

async function authenticatedGetResponse(
  httpClient: Pick<HttpClient, "getResponse">,
  path: string,
): Promise<HttpResponse> {
  const token = await requireAccessToken();
  return httpClient.getResponse(path, { bearerToken: token });
}

async function authenticatedPost(
  httpClient: Pick<HttpClient, "post">,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const token = await requireAccessToken();
  return httpClient.post(path, body, { bearerToken: token });
}

async function authenticatedPostResponse(
  httpClient: Pick<HttpClient, "postResponse">,
  path: string,
  body?: unknown,
): Promise<HttpResponse> {
  const token = await requireAccessToken();
  return httpClient.postResponse(path, body, { bearerToken: token });
}

async function authenticatedPatch(
  httpClient: Pick<HttpClient, "patch">,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const token = await requireAccessToken();
  return httpClient.patch(path, body, { bearerToken: token });
}

async function authenticatedPatchResponse(
  httpClient: Pick<HttpClient, "patchResponse">,
  path: string,
  body?: unknown,
): Promise<HttpResponse> {
  const token = await requireAccessToken();
  return httpClient.patchResponse(path, body, { bearerToken: token });
}

async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new AppError(
      "La sesión autenticada es necesaria para esta operación.",
      "AUTHENTICATION_REQUIRED",
    );
  }
  return token;
}
