import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api/api-error";

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  execute: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT_TEST");
  }),
}));

vi.mock("@/modules/auth/auth.composition.server", () => ({
  createLoginUser: () => ({ execute: mocks.execute }),
}));

vi.mock("@/modules/auth/infrastructure/session/auth-session.server", () => ({
  createSession: mocks.createSession,
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { initialLoginActionState } from "@/modules/auth/presentation/login-action-state";

import { loginAction } from "./login.action";

const session = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "user@example.com",
    name: "User",
  },
  tokens: {
    accessToken: "access-token",
    accessTokenExpiresAt: new Date("2026-08-21T10:15:00.000Z"),
    refreshToken: "refresh-token",
    refreshTokenExpiresAt: new Date("2026-08-22T10:00:00.000Z"),
  },
} as const;

function createFormData(email: string, password: string): FormData {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

describe("loginAction", () => {
  beforeEach(() => {
    mocks.createSession.mockReset();
    mocks.execute.mockReset();
    mocks.redirect.mockClear();
  });

  it("authenticates, stores only tokens and redirects", async () => {
    mocks.execute.mockResolvedValue(session);
    mocks.createSession.mockResolvedValue(undefined);

    await expect(
      loginAction(
        initialLoginActionState,
        createFormData(" USER@Example.COM ", "password"),
      ),
    ).rejects.toThrow("NEXT_REDIRECT_TEST");

    expect(mocks.execute).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password",
    });
    expect(mocks.createSession).toHaveBeenCalledWith(session.tokens);
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("returns field errors before constructing the backend flow", async () => {
    const result = await loginAction(
      initialLoginActionState,
      createFormData("invalid-email", ""),
    );

    expect(result.fieldErrors?.email).toBeTruthy();
    expect(result.fieldErrors?.password).toBeTruthy();
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("returns a safe message for rejected credentials", async () => {
    mocks.execute.mockRejectedValue(
      new ApiError("Internal message", "API_HTTP_ERROR", { status: 401 }),
    );

    await expect(
      loginAction(
        initialLoginActionState,
        createFormData("user@example.com", "wrong-password"),
      ),
    ).resolves.toEqual({ formError: "Email o contraseña incorrectos." });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
