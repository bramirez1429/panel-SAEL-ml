import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api/api-error";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  getSessionTokens: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT_TEST");
  }),
}));

vi.mock("@/modules/auth/auth.composition.server", () => ({
  createGetCurrentUserQuery: () => ({ execute: mocks.execute }),
}));

vi.mock("@/modules/auth/infrastructure/session/auth-session.server", () => ({
  getSessionTokens: mocks.getSessionTokens,
}));

vi.mock("./login.action", () => ({
  loginAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import LoginPage from "./page";

describe("LoginPage", () => {
  beforeEach(() => {
    cleanup();
    mocks.execute.mockReset();
    mocks.getSessionTokens.mockReset();
    mocks.redirect.mockClear();
  });

  it("renders the login form when there is no stored session", async () => {
    mocks.getSessionTokens.mockResolvedValue(null);

    render(await LoginPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Iniciar sesión" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("redirects only after NestJS verifies the stored access token", async () => {
    mocks.getSessionTokens.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    mocks.execute.mockResolvedValue({ id: "user-id" });

    await expect(LoginPage()).rejects.toThrow("NEXT_REDIRECT_TEST");
    expect(mocks.execute).toHaveBeenCalledWith("access-token");
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("shows login when NestJS rejects stored tokens with 401", async () => {
    mocks.getSessionTokens.mockResolvedValue({
      accessToken: "expired-token",
      refreshToken: "refresh-token",
    });
    mocks.execute.mockRejectedValue(
      new ApiError("Unauthorized", "API_HTTP_ERROR", { status: 401 }),
    );

    render(await LoginPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Iniciar sesión" }),
    ).toBeInTheDocument();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("does not hide unexpected session verification failures", async () => {
    mocks.getSessionTokens.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    mocks.execute.mockRejectedValue(new Error("Unexpected programming error"));

    await expect(LoginPage()).rejects.toThrow("Unexpected programming error");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
