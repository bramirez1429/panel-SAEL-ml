import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/shared/errors/app-error";

import type { BackendStatusRepository } from "../domain/backend-status.repository";
import { GetBackendStatusQuery } from "./get-backend-status.query";

describe("GetBackendStatusQuery", () => {
  it("returns the status supplied by its repository", async () => {
    const backendStatus = { state: "available" } as const;
    const getStatus = vi.fn<BackendStatusRepository["getStatus"]>();
    getStatus.mockResolvedValue(backendStatus);
    const query = new GetBackendStatusQuery({ getStatus });

    await expect(query.execute()).resolves.toEqual(backendStatus);
    expect(getStatus).toHaveBeenCalledOnce();
  });

  it("propagates the exact repository error", async () => {
    const repositoryError = new AppError(
      "Backend unavailable",
      "API_UNREACHABLE",
    );
    const getStatus = vi.fn<BackendStatusRepository["getStatus"]>();
    getStatus.mockRejectedValue(repositoryError);
    const query = new GetBackendStatusQuery({ getStatus });

    await expect(query.execute()).rejects.toBe(repositoryError);
  });
});
