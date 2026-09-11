import "server-only";

import { redirect } from "next/navigation";

import {
  createSession,
  deleteSession,
  getAccessToken,
  getRefreshToken,
} from "@/modules/auth/infrastructure/session/auth-session.server";
import { AppError } from "@/shared/errors/app-error";
import { ApiError } from "./api-error";
import type { HttpClient, HttpResponse } from "./http-client.server";
import { refreshPanelSession } from "./session-refresh.server";

export type AuthenticatedHttpClient = Readonly<{
  get(path: string, options?: AuthenticatedRequestOptions): Promise<unknown>;
  getResponse(path: string, options?: AuthenticatedRequestOptions): Promise<HttpResponse>;
  post(path: string, body?: unknown, options?: AuthenticatedRequestOptions): Promise<unknown>;
  postResponse(path: string, body?: unknown, options?: AuthenticatedRequestOptions): Promise<HttpResponse>;
  patch(path: string, body?: unknown): Promise<unknown>;
  patchResponse(path: string, body?: unknown): Promise<HttpResponse>;
  delete(path: string, options?: AuthenticatedRequestOptions): Promise<unknown>;
  deleteResponse(path: string, options?: AuthenticatedRequestOptions): Promise<HttpResponse>;
}>;
export type AuthenticatedRequestOptions = Readonly<{ timeoutMs?: number }>;

type RawHttpClient = Pick<
  HttpClient,
  "get" | "getResponse" | "post" | "postResponse" | "patch" | "patchResponse" | "delete" | "deleteResponse"
>;

/**
 * Único wrapper de requests privadas. Agrega el Bearer y, ante una sesión
 * vencida, renueva los tokens del Panel y repite la operación una sola vez.
 */
export function createAuthenticatedHttpClient(httpClient: RawHttpClient): AuthenticatedHttpClient {
  return {
    get: (path, options) => withPanelSession(httpClient, (token) => httpClient.get(path, { ...options, bearerToken: token })),
    getResponse: (path, options) => withPanelSession(httpClient, (token) => httpClient.getResponse(path, { ...options, bearerToken: token })),
    post: (path, body, options) => withPanelSession(httpClient, (token) => httpClient.post(path, body, { ...options, bearerToken: token })),
    postResponse: (path, body, options) => withPanelSession(httpClient, (token) => httpClient.postResponse(path, body, { ...options, bearerToken: token })),
    patch: (path, body) => withPanelSession(httpClient, (token) => httpClient.patch(path, body, { bearerToken: token })),
    patchResponse: (path, body) => withPanelSession(httpClient, (token) => httpClient.patchResponse(path, body, { bearerToken: token })),
    delete: (path, options) => withPanelSession(httpClient, (token) => httpClient.delete(path, { ...options, bearerToken: token })),
    deleteResponse: (path, options) => withPanelSession(httpClient, (token) => httpClient.deleteResponse(path, { ...options, bearerToken: token })),
  };
}

async function withPanelSession<T>(
  httpClient: RawHttpClient,
  request: (accessToken: string) => Promise<T>,
): Promise<T> {
  const storedAccessToken = await getAccessToken();
  if (!storedAccessToken) {
    const renewedAccessToken = await renewSessionOrRedirect(httpClient);
    return retryOnceOrRedirect(request, renewedAccessToken);
  }

  try {
    return await request(storedAccessToken);
  } catch (error: unknown) {
    if (!isAuthenticationFailure(error)) throw error;
    const renewedAccessToken = await renewSessionOrRedirect(httpClient);
    return retryOnceOrRedirect(request, renewedAccessToken);
  }
}

async function retryOnceOrRedirect<T>(
  request: (accessToken: string) => Promise<T>,
  renewedAccessToken: string,
): Promise<T> {
  try {
    return await request(renewedAccessToken);
  } catch (error: unknown) {
    if (!isAuthenticationFailure(error)) throw error;
    return clearSessionAndRedirect();
  }
}

async function renewSessionOrRedirect(httpClient: Pick<HttpClient, "post">): Promise<string> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return clearSessionAndRedirect();

  try {
    const tokens = await refreshPanelSession(httpClient, refreshToken);
    await createSession(tokens);
    return tokens.accessToken;
  } catch {
    return clearSessionAndRedirect();
  }
}

export function isAuthenticationFailure(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 401) return true;
  if (error instanceof AppError && error.code === "AUTHENTICATION_REQUIRED") return true;
  if (!(error instanceof ApiError) || !isRecord(error.responseBody)) return false;
  return error.responseBody.code === "AUTHENTICATION_REQUIRED";
}

async function clearSessionAndRedirect(): Promise<never> {
  try {
    await deleteSession();
  } finally {
    redirect("/login");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
