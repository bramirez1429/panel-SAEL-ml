import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteSession: vi.fn(),
  execute: vi.fn(),
  getAccessToken: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT_TEST");
  }),
}));

vi.mock("@/modules/auth/auth.composition.server", () => ({
  createLogoutUser: () => ({ execute: mocks.execute }),
}));

vi.mock("@/modules/auth/infrastructure/session/auth-session.server", () => ({
  deleteSession: mocks.deleteSession,
  getAccessToken: mocks.getAccessToken,
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { logoutAction } from "./logout.action";

describe("logoutAction", () => {
  beforeEach(() => {
    mocks.deleteSession.mockReset().mockResolvedValue(undefined);
    mocks.execute.mockReset().mockResolvedValue(undefined);
    mocks.getAccessToken.mockReset();
    mocks.redirect.mockClear();
  });

  it("revokes the backend session, removes cookies and redirects", async () => {
    mocks.getAccessToken.mockResolvedValue("signed-access-token");

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT_TEST");

    expect(mocks.execute).toHaveBeenCalledWith("signed-access-token");
    expect(mocks.deleteSession).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("clears the local session when no access token remains", async () => {
    mocks.getAccessToken.mockResolvedValue(null);

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT_TEST");

    expect(mocks.execute).not.toHaveBeenCalled();
    expect(mocks.deleteSession).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("still clears cookies and redirects when remote revocation fails", async () => {
    mocks.getAccessToken.mockResolvedValue("expired-access-token");
    mocks.execute.mockRejectedValue(new Error("backend unavailable"));

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT_TEST");

    expect(mocks.deleteSession).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
});
