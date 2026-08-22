import { describe, expect, it } from "vitest";

import { mapLoginResponse } from "./login-response.mapper";

describe("mapLoginResponse", () => {
  it("maps the validated DTO to application tokens", () => {
    expect(
      mapLoginResponse({
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
      }),
    ).toEqual({
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "user@example.com",
        name: "Panel User",
      },
      tokens: {
        accessToken: "access-token",
        accessTokenExpiresAt: new Date("2026-08-22T03:15:00.000Z"),
        refreshToken: "refresh-token",
        refreshTokenExpiresAt: new Date("2026-08-23T03:00:00.000Z"),
      },
    });
  });
});
