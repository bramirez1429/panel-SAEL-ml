// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));

import {
  AUTH_COOKIE_NAMES,
  AUTH_SESSION_DURATION_SECONDS,
} from "./auth-cookie.config";
import {
  createSession,
  deleteSession,
  getAccessToken,
  getRefreshToken,
  getSessionTokens,
  hasStoredSession,
} from "./auth-session.server";

interface CookieStoreMock {
  readonly delete: ReturnType<typeof vi.fn>;
  readonly get: ReturnType<typeof vi.fn>;
  readonly set: ReturnType<typeof vi.fn>;
}

function createCookieStore(
  values: Readonly<Record<string, string | undefined>> = {},
): CookieStoreMock {
  return {
    delete: vi.fn(),
    get: vi.fn((name: string) => {
      const value = values[name];
      return value === undefined ? undefined : { name, value };
    }),
    set: vi.fn(),
  };
}

describe("auth session", () => {
  const now = new Date("2026-08-22T12:00:00.000Z");

  beforeEach(() => {
    cookiesMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores both tokens using their distinct backend expirations", async () => {
    const cookieStore = createCookieStore();
    cookiesMock.mockResolvedValue(cookieStore);
    const accessTokenExpiresAt = new Date("2026-08-22T12:15:00.000Z");
    const refreshTokenExpiresAt = new Date("2026-08-24T12:00:00.000Z");

    await createSession({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    });

    expect(cookieStore.set).toHaveBeenNthCalledWith(
      1,
      AUTH_COOKIE_NAMES.accessToken,
      "new-access-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 900,
        expires: accessTokenExpiresAt,
      }),
    );
    expect(cookieStore.set).toHaveBeenNthCalledWith(
      2,
      AUTH_COOKIE_NAMES.refreshToken,
      "new-refresh-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: AUTH_SESSION_DURATION_SECONDS,
        expires: new Date("2026-08-23T12:00:00.000Z"),
      }),
    );
  });

  it("keeps the refresh token readable after the access token is gone", async () => {
    cookiesMock.mockResolvedValue(
      createCookieStore({
        [AUTH_COOKIE_NAMES.refreshToken]: "refresh-token",
      }),
    );

    await expect(getSessionTokens()).resolves.toBeNull();
    await expect(hasStoredSession()).resolves.toBe(false);
    await expect(getRefreshToken()).resolves.toBe("refresh-token");
  });

  it("reads the access token independently for authenticated server requests", async () => {
    cookiesMock.mockResolvedValue(
      createCookieStore({
        [AUTH_COOKIE_NAMES.accessToken]: "access-token",
      }),
    );

    await expect(getAccessToken()).resolves.toBe("access-token");
  });

  it("returns both stored tokens and reports the session", async () => {
    const cookieStore = createCookieStore({
      [AUTH_COOKIE_NAMES.accessToken]: "access-token",
      [AUTH_COOKIE_NAMES.refreshToken]: "refresh-token",
    });
    cookiesMock.mockResolvedValue(cookieStore);

    await expect(getSessionTokens()).resolves.toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    await expect(hasStoredSession()).resolves.toBe(true);
  });

  it.each([
    ["no cookies", {}],
    [
      "missing refresh token",
      { [AUTH_COOKIE_NAMES.accessToken]: "access-token" },
    ],
    [
      "missing access token",
      { [AUTH_COOKIE_NAMES.refreshToken]: "refresh-token" },
    ],
    [
      "empty token",
      {
        [AUTH_COOKIE_NAMES.accessToken]: "access-token",
        [AUTH_COOKIE_NAMES.refreshToken]: "   ",
      },
    ],
  ])("treats %s as an absent session", async (_description, values) => {
    cookiesMock.mockResolvedValue(createCookieStore(values));

    await expect(getSessionTokens()).resolves.toBeNull();
    await expect(hasStoredSession()).resolves.toBe(false);
  });

  it("deletes both token cookies", async () => {
    const cookieStore = createCookieStore();
    cookiesMock.mockResolvedValue(cookieStore);

    await deleteSession();

    expect(cookieStore.set).toHaveBeenCalledTimes(2);
    expect(cookieStore.set).toHaveBeenNthCalledWith(
      1,
      AUTH_COOKIE_NAMES.accessToken,
      "",
      expect.objectContaining({
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      }),
    );
    expect(cookieStore.set).toHaveBeenNthCalledWith(
      2,
      AUTH_COOKIE_NAMES.refreshToken,
      "",
      expect.objectContaining({
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      }),
    );
  });
});
