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
  get(path: string, options?: AuthenticatedRequestOptions): Promise<unknown>;
  getResponse(path: string, options?: AuthenticatedRequestOptions): Promise<HttpResponse>;
  post(path: string, body?: unknown, options?: AuthenticatedRequestOptions): Promise<unknown>;
  postResponse(path: string, body?: unknown, options?: AuthenticatedRequestOptions): Promise<HttpResponse>;
  patch(path: string, body?: unknown): Promise<unknown>;
  patchResponse(path: string, body?: unknown): Promise<HttpResponse>;
  delete(path: string): Promise<unknown>;
  deleteResponse(path: string): Promise<HttpResponse>;
}>;
export type AuthenticatedRequestOptions = Readonly<{ timeoutMs?: number }>;

export function createAuthenticatedHttpClient(
  httpClient: Pick<
    HttpClient,
    "get" | "getResponse" | "post" | "postResponse" | "patch" | "patchResponse" | "delete" | "deleteResponse"
  >,
): AuthenticatedHttpClient {
  return {
    get: (path, options) => authenticatedGet(httpClient, path, options),
    getResponse: (path, options) => authenticatedGetResponse(httpClient, path, options),
    post: (path, body, options) => authenticatedPost(httpClient, path, body, options),
    postResponse: (path, body, options) => authenticatedPostResponse(httpClient, path, body, options),
    patch: (path, body) => authenticatedPatch(httpClient, path, body),
    patchResponse: (path, body) => authenticatedPatchResponse(httpClient, path, body),
    delete: (path) => authenticatedDelete(httpClient, path),
    deleteResponse: (path) => authenticatedDeleteResponse(httpClient, path),
  };
}

async function authenticatedGet(
  httpClient: Pick<HttpClient, "get">,
  path: string,
  options?: AuthenticatedRequestOptions,
): Promise<unknown> {
  const token = await requireAccessToken();
  return httpClient.get(path, { bearerToken: token, ...options });
}

async function authenticatedGetResponse(
  httpClient: Pick<HttpClient, "getResponse">,
  path: string,
  options?: AuthenticatedRequestOptions,
): Promise<HttpResponse> {
  const token = await requireAccessToken();
  return httpClient.getResponse(path, { bearerToken: token, ...options });
}

async function authenticatedPost(
  httpClient: Pick<HttpClient, "post">,
  path: string,
  body?: unknown,
  options?: AuthenticatedRequestOptions,
): Promise<unknown> {
  const token = await requireAccessToken();
  return httpClient.post(path, body, { bearerToken: token, ...options });
}

async function authenticatedPostResponse(
  httpClient: Pick<HttpClient, "postResponse">,
  path: string,
  body?: unknown,
  options?: AuthenticatedRequestOptions,
): Promise<HttpResponse> {
  const token = await requireAccessToken();
  return httpClient.postResponse(path, body, { bearerToken: token, ...options });
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

async function authenticatedDelete(httpClient: Pick<HttpClient, "delete">, path: string): Promise<unknown> {
  const token = await requireAccessToken();
  return httpClient.delete(path, { bearerToken: token });
}

async function authenticatedDeleteResponse(httpClient: Pick<HttpClient, "deleteResponse">, path: string): Promise<HttpResponse> {
  const token = await requireAccessToken();
  return httpClient.deleteResponse(path, { bearerToken: token });
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
