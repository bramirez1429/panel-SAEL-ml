import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api/api-error";

import type { AuthSession, LoginCredentials } from "../domain/auth.model";
import type { AuthRepository } from "../domain/auth.repository";
import { LoginUser } from "./login-user";

const credentials: LoginCredentials = {
  email: "user@example.com",
  password: "a-secure-password",
};

const session: AuthSession = {
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
};

describe("LoginUser", () => {
  it("authenticates through the repository contract", async () => {
    const login = vi.fn<AuthRepository["login"]>().mockResolvedValue(session);
    const useCase = new LoginUser({
      getCurrentUser: vi.fn<AuthRepository["getCurrentUser"]>(),
      login,
      logout: vi.fn<AuthRepository["logout"]>(),
    });

    await expect(useCase.execute(credentials)).resolves.toBe(session);
    expect(login).toHaveBeenCalledWith(credentials);
  });

  it("preserves rejected credentials as a controlled error", async () => {
    const rejectedCredentials = new ApiError(
      "El backend respondió con HTTP 401.",
      "API_HTTP_ERROR",
      { status: 401 },
    );
    const login = vi
      .fn<AuthRepository["login"]>()
      .mockRejectedValue(rejectedCredentials);
    const useCase = new LoginUser({
      getCurrentUser: vi.fn<AuthRepository["getCurrentUser"]>(),
      login,
      logout: vi.fn<AuthRepository["logout"]>(),
    });

    await expect(useCase.execute(credentials)).rejects.toBe(
      rejectedCredentials,
    );
  });

  it("propagates controlled infrastructure failures", async () => {
    const timeoutError = new ApiError(
      "La solicitud al backend superó el tiempo límite.",
      "API_TIMEOUT",
    );
    const login = vi
      .fn<AuthRepository["login"]>()
      .mockRejectedValue(timeoutError);
    const useCase = new LoginUser({
      getCurrentUser: vi.fn<AuthRepository["getCurrentUser"]>(),
      login,
      logout: vi.fn<AuthRepository["logout"]>(),
    });

    await expect(useCase.execute(credentials)).rejects.toBe(timeoutError);
  });
});
