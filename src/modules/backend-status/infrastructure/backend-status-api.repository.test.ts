import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api/api-error";
import type { HttpGetClient } from "@/shared/api/http-client.server";

import { BackendStatusApiRepository } from "./backend-status-api.repository";

describe("BackendStatusApiRepository", () => {
  it("requests the verified endpoint and maps its response", async () => {
    const get = vi.fn<HttpGetClient["get"]>();
    get.mockResolvedValue("Hello World!");
    const repository = new BackendStatusApiRepository({ get });

    await expect(repository.getStatus()).resolves.toEqual({ state: "available" });
    expect(get).toHaveBeenCalledWith("/");
  });

  it("translates an invalid response into a controlled API error", async () => {
    const get = vi.fn<HttpGetClient["get"]>();
    get.mockResolvedValue({ message: "unexpected" });
    const repository = new BackendStatusApiRepository({ get });

    try {
      await repository.getStatus();
      throw new Error("Expected repository.getStatus() to reject");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ApiError);

      if (!(error instanceof ApiError)) {
        throw error;
      }

      expect(error.code).toBe("API_INVALID_RESPONSE");
      expect(error.cause).toBeDefined();
    }
  });

  it("preserves controlled transport errors", async () => {
    const transportError = new ApiError(
      "No se pudo conectar con el backend.",
      "API_UNREACHABLE",
    );
    const get = vi.fn<HttpGetClient["get"]>();
    get.mockRejectedValue(transportError);
    const repository = new BackendStatusApiRepository({ get });

    await expect(repository.getStatus()).rejects.toBe(transportError);
  });
});
