import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api/api-error";

import type { AuthRepository } from "../domain/auth.repository";
import { LogoutUser } from "./logout-user";

function createRepository(
  logout: AuthRepository["logout"],
): AuthRepository {
  return {
    getCurrentUser: vi.fn<AuthRepository["getCurrentUser"]>(),
    login: vi.fn<AuthRepository["login"]>(),
    logout,
  };
}

describe("LogoutUser", () => {
  it("revokes the authenticated session through the repository contract", async () => {
    const logout = vi.fn<AuthRepository["logout"]>().mockResolvedValue();
    const useCase = new LogoutUser(createRepository(logout));

    await expect(useCase.execute("signed-access-token")).resolves.toBeUndefined();
    expect(logout).toHaveBeenCalledWith("signed-access-token");
  });

  it("preserves controlled infrastructure failures for the composition root", async () => {
    const unreachableError = new ApiError(
      "No se pudo conectar con el backend.",
      "API_UNREACHABLE",
    );
    const logout = vi
      .fn<AuthRepository["logout"]>()
      .mockRejectedValue(unreachableError);
    const useCase = new LogoutUser(createRepository(logout));

    await expect(useCase.execute("signed-access-token")).rejects.toBe(
      unreachableError,
    );
  });
});
