import "server-only";

import { cookies } from "next/headers";

import type { AuthTokens } from "@/modules/auth/domain/auth.model";

import {
  AUTH_COOKIE_NAMES,
  getAuthCookieOptions,
  getExpiredAuthCookieOptions,
} from "./auth-cookie.config";

export type StoredAuthTokens = Pick<
  AuthTokens,
  "accessToken" | "refreshToken"
>;

/**
 * Unico limite responsable de persistir tokens de aplicacion. Al ser
 * server-only, los valores HttpOnly nunca se entregan a componentes cliente.
 */
export async function createSession(tokens: AuthTokens): Promise<void> {
  const cookieStore = await cookies();
  const now = new Date();

  cookieStore.set(
    AUTH_COOKIE_NAMES.accessToken,
    tokens.accessToken,
    getAuthCookieOptions(tokens.accessTokenExpiresAt, now),
  );
  cookieStore.set(
    AUTH_COOKIE_NAMES.refreshToken,
    tokens.refreshToken,
    getAuthCookieOptions(tokens.refreshTokenExpiresAt, now),
  );
}

export async function getSessionTokens(): Promise<StoredAuthTokens | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const refreshToken = cookieStore.get(AUTH_COOKIE_NAMES.refreshToken)?.value;

  if (!isNonEmptyToken(accessToken) || !isNonEmptyToken(refreshToken)) {
    return null;
  }

  return { accessToken, refreshToken };
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value;

  return isNonEmptyToken(accessToken) ? accessToken : null;
}

/** Permite que la futura rotacion sobreviva al vencimiento del access token. */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(AUTH_COOKIE_NAMES.refreshToken)?.value;

  return isNonEmptyToken(refreshToken) ? refreshToken : null;
}

export async function hasStoredSession(): Promise<boolean> {
  return (await getSessionTokens()) !== null;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const options = getExpiredAuthCookieOptions();

  cookieStore.set(AUTH_COOKIE_NAMES.accessToken, "", options);
  cookieStore.set(AUTH_COOKIE_NAMES.refreshToken, "", options);
}

function isNonEmptyToken(token: string | undefined): token is string {
  return typeof token === "string" && token.trim().length > 0;
}
