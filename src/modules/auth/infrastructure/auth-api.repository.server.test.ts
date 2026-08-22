// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ApiError } from "@/shared/api/api-error";
import type {
  HttpGetClient,
  HttpPostClient,
} from "@/shared/api/http-client.server";

import { AuthApiRepository } from "./auth-api.repository.server";

const credentials = {
  email: "user@example.com",
  password: "a-secure-password",
} as const;

const loginResponse = {
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
} as const;

describe("AuthApiRepository", () => {
  it("posts credentials to the verified NestJS endpoint and maps tokens", async () => {
    const post = vi
      .fn<HttpPostClient["post"]>()
      .mockResolvedValue(loginResponse);
    const repository = new AuthApiRepository({
      get: vi.fn<HttpGetClient["get"]>(),
      post,
    });

    await expect(repository.login(credentials)).resolves.toEqual({
      user: expect.objectContaining({
        id: loginResponse.user.id,
        email: loginResponse.user.email,
      }),
      tokens: {
        accessToken: "access-token",
        accessTokenExpiresAt: new Date(loginResponse.accessTokenExpiresAt),
        refreshToken: "refresh-token",
        refreshTokenExpiresAt: new Date(loginResponse.refreshTokenExpiresAt),
      },
    });
    expect(post).toHaveBeenCalledWith("/auth/login", credentials);
  });

  it("translates an invalid response into a controlled API error", async () => {
    const post = vi.fn<HttpPostClient["post"]>().mockResolvedValue({
      access_token: "unexpected-shape",
    });
    const repository = new AuthApiRepository({
      get: vi.fn<HttpGetClient["get"]>(),
      post,
    });

    await expect(repository.login(credentials)).rejects.toMatchObject({
      code: "API_INVALID_RESPONSE",
      cause: expect.anything(),
    });
  });

  it("preserves transport and credential errors", async () => {
    const unauthorizedError = new ApiError(
      "El backend respondió con HTTP 401.",
      "API_HTTP_ERROR",
      { status: 401 },
    );
    const post = vi
      .fn<HttpPostClient["post"]>()
      .mockRejectedValue(unauthorizedError);
    const repository = new AuthApiRepository({
      get: vi.fn<HttpGetClient["get"]>(),
      post,
    });

    await expect(repository.login(credentials)).rejects.toBe(
      unauthorizedError,
    );
  });

  it("verifies the current user with the access token", async () => {
    const get = vi
      .fn<HttpGetClient["get"]>()
      .mockResolvedValue(loginResponse.user);
    const repository = new AuthApiRepository({
      get,
      post: vi.fn<HttpPostClient["post"]>(),
    });

    await expect(
      repository.getCurrentUser("signed-access-token"),
    ).resolves.toEqual({
      id: loginResponse.user.id,
      email: loginResponse.user.email,
      name: loginResponse.user.name,
    });
    expect(get).toHaveBeenCalledWith("/auth/me", {
      bearerToken: "signed-access-token",
    });
  });

  it("preserves a rejected current session", async () => {
    const unauthorizedError = new ApiError(
      "El backend respondió con HTTP 401.",
      "API_HTTP_ERROR",
      { status: 401 },
    );
    const get = vi
      .fn<HttpGetClient["get"]>()
      .mockRejectedValue(unauthorizedError);
    const repository = new AuthApiRepository({
      get,
      post: vi.fn<HttpPostClient["post"]>(),
    });

    await expect(
      repository.getCurrentUser("expired-access-token"),
    ).rejects.toBe(unauthorizedError);
  });

  it("rejects an invalid current-user response", async () => {
    const get = vi.fn<HttpGetClient["get"]>().mockResolvedValue({
      id: "user-id",
      email: "invalid-email",
    });
    const repository = new AuthApiRepository({
      get,
      post: vi.fn<HttpPostClient["post"]>(),
    });

    await expect(
      repository.getCurrentUser("signed-access-token"),
    ).rejects.toMatchObject({ code: "API_INVALID_RESPONSE" });
  });

  it("logs out through the verified endpoint using only the access token", async () => {
    const post = vi.fn<HttpPostClient["post"]>().mockResolvedValue("");
    const repository = new AuthApiRepository({
      get: vi.fn<HttpGetClient["get"]>(),
      post,
    });

    await expect(repository.logout("signed-access-token")).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith("/auth/logout", undefined, {
      bearerToken: "signed-access-token",
    });
  });

  it("preserves logout transport errors", async () => {
    const unreachableError = new ApiError(
      "No se pudo conectar con el backend.",
      "API_UNREACHABLE",
    );
    const post = vi
      .fn<HttpPostClient["post"]>()
      .mockRejectedValue(unreachableError);
    const repository = new AuthApiRepository({
      get: vi.fn<HttpGetClient["get"]>(),
      post,
    });

    await expect(repository.logout("signed-access-token")).rejects.toBe(
      unreachableError,
    );
  });
});
