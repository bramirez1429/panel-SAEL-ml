import { describe, expect, it } from "vitest";

import {
  AUTH_COOKIE_NAMES,
  AUTH_SESSION_DURATION_SECONDS,
  getAuthCookieOptions,
  getExpiredAuthCookieOptions,
} from "./auth-cookie.config";

describe("auth cookie config", () => {
  const now = new Date("2026-08-22T12:00:00.000Z");

  it("configures both token cookies with distinct names", () => {
    expect(AUTH_COOKIE_NAMES.accessToken).not.toBe(
      AUTH_COOKIE_NAMES.refreshToken,
    );
  });

  it("limits the application session to 24 hours", () => {
    const backendExpiration = new Date("2026-08-24T12:00:00.000Z");

    expect(AUTH_SESSION_DURATION_SECONDS).toBe(86_400);
    expect(
      getAuthCookieOptions(backendExpiration, now, "development"),
    ).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 86_400,
      expires: new Date("2026-08-23T12:00:00.000Z"),
    });
  });

  it("enables secure cookies in production", () => {
    expect(
      getAuthCookieOptions(
        new Date("2026-08-22T13:00:00.000Z"),
        now,
        "production",
      ).secure,
    ).toBe(true);
  });

  it("uses the shorter backend expiration and floors partial seconds", () => {
    const backendExpiration = new Date("2026-08-22T12:05:00.900Z");

    expect(getAuthCookieOptions(backendExpiration, now, "development")).toMatchObject({
      maxAge: 300,
      expires: new Date("2026-08-22T12:05:00.000Z"),
    });
  });

  it("expires an already stale token immediately", () => {
    expect(
      getAuthCookieOptions(
        new Date("2026-08-22T11:59:59.000Z"),
        now,
        "development",
      ).maxAge,
    ).toBe(0);
  });

  it("creates path-aware removal options", () => {
    expect(getExpiredAuthCookieOptions("production")).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  });
});
