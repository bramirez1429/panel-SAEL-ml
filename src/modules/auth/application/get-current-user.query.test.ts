import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api/api-error";

import type { User } from "../domain/auth.model";
import type { AuthRepository } from "../domain/auth.repository";
import { GetCurrentUserQuery } from "./get-current-user.query";

const user: User = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "user@example.com",
  name: "Panel User",
};

function createRepository(
  getCurrentUser: AuthRepository["getCurrentUser"],
): AuthRepository {
  return {
    getCurrentUser,
    login: vi.fn<AuthRepository["login"]>(),
    logout: vi.fn<AuthRepository["logout"]>(),
  };
}

describe("GetCurrentUserQuery", () => {
  it("verifies the access token through the repository contract", async () => {
    const getCurrentUser = vi
      .fn<AuthRepository["getCurrentUser"]>()
      .mockResolvedValue(user);
    const query = new GetCurrentUserQuery(createRepository(getCurrentUser));

    await expect(query.execute("signed-access-token")).resolves.toBe(user);
    expect(getCurrentUser).toHaveBeenCalledWith("signed-access-token");
  });

  it("preserves an unauthorized response", async () => {
    const unauthorizedError = new ApiError(
      "El backend respondió con HTTP 401.",
      "API_HTTP_ERROR",
      { status: 401 },
    );
    const getCurrentUser = vi
      .fn<AuthRepository["getCurrentUser"]>()
      .mockRejectedValue(unauthorizedError);
    const query = new GetCurrentUserQuery(createRepository(getCurrentUser));

    await expect(query.execute("expired-access-token")).rejects.toBe(
      unauthorizedError,
    );
  });
});
