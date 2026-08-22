import { describe, expect, it } from "vitest";

import { loginResponseSchema } from "./login-response.schema";

describe("loginResponseSchema", () => {
  it("accepts the verified NestJS login response", () => {
    const response = {
      accessToken: "access-token",
      accessTokenExpiresAt: "2026-08-22T03:15:00.000Z",
      refreshToken: "refresh-token",
      refreshTokenExpiresAt: "2026-08-23T03:00:00.000Z",
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "user@example.com",
        name: "Panel User",
        isActive: true,
        createdAt: "2026-08-01T12:00:00.000Z",
        updatedAt: "2026-08-20T12:00:00.000Z",
      },
    };

    expect(loginResponseSchema.parse(response)).toEqual(response);
  });

  it.each([
    { refreshToken: "refresh-token" },
    {
      accessToken: "access-token",
      accessTokenExpiresAt: "not-a-date",
      refreshToken: "refresh-token",
      refreshTokenExpiresAt: "2026-08-23T03:00:00.000Z",
      user: {
        id: "user-id",
        email: "user@example.com",
        name: null,
        isActive: true,
        createdAt: "2026-08-01T12:00:00.000Z",
        updatedAt: "2026-08-20T12:00:00.000Z",
      },
    },
    {
      accessToken: "access-token",
      accessTokenExpiresAt: "2026-08-22T03:15:00.000Z",
      refreshToken: "refresh-token",
      refreshTokenExpiresAt: "2026-08-23T03:00:00.000Z",
      user: {
        id: "user-id",
        email: "invalid-email",
        name: null,
        isActive: true,
        createdAt: "2026-08-01T12:00:00.000Z",
        updatedAt: "2026-08-20T12:00:00.000Z",
      },
    },
  ])("rejects an invalid external response", (response) => {
    expect(loginResponseSchema.safeParse(response).success).toBe(false);
  });
});
