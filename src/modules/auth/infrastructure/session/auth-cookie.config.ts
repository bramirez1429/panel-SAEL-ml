export const AUTH_SESSION_DURATION_SECONDS = 60 * 60 * 24;

export const AUTH_COOKIE_NAMES = {
  accessToken: "panel_auth_access_token",
  refreshToken: "panel_auth_refresh_token",
} as const;

export interface AuthCookieOptions {
  readonly httpOnly: true;
  readonly secure: boolean;
  readonly sameSite: "lax";
  readonly path: "/";
  readonly maxAge: number;
  readonly expires: Date;
}

/**
 * Aplica a cada token su vencimiento real sin permitir que una cookie de la
 * aplicacion sobreviva mas de 24 horas.
 */
export function getAuthCookieOptions(
  expiresAt: Date,
  now: Date = new Date(),
  environment: string | undefined = process.env.NODE_ENV,
): AuthCookieOptions {
  const secondsUntilExpiration = Math.floor(
    (expiresAt.getTime() - now.getTime()) / 1_000,
  );

  const maxAge = Math.min(
    Math.max(secondsUntilExpiration, 0),
    AUTH_SESSION_DURATION_SECONDS,
  );

  return {
    httpOnly: true,
    secure: environment === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
    expires: new Date(now.getTime() + maxAge * 1_000),
  };
}

export function getExpiredAuthCookieOptions(
  environment: string | undefined = process.env.NODE_ENV,
): AuthCookieOptions {
  return {
    httpOnly: true,
    secure: environment === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
}
