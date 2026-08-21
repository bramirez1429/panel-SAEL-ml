import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ApiError } from "./api-error";
import { getApiConfig } from "./api-config";

describe("getApiConfig", () => {
  it("normalizes the base URL and applies the default timeout", () => {
    expect(
      getApiConfig({
        BACKEND_API_URL: "https://api.example.com/",
      }),
    ).toEqual({
      baseUrl: "https://api.example.com",
      timeoutMs: 5_000,
    });
  });

  it("accepts a configured timeout", () => {
    expect(
      getApiConfig({
        BACKEND_API_URL: "http://localhost:3001",
        BACKEND_API_TIMEOUT_MS: "2500",
      }).timeoutMs,
    ).toBe(2_500);
  });

  const invalidConfigurations = [
    [{}, "missing URL"],
    [{ BACKEND_API_URL: "ftp://api.example.com" }, "unsupported protocol"],
    [
      {
        BACKEND_API_URL: "https://api.example.com",
        BACKEND_API_TIMEOUT_MS: "0",
      },
      "invalid timeout",
    ],
  ] satisfies ReadonlyArray<
    readonly [Readonly<Record<string, string | undefined>>, string]
  >;

  for (const [environment, description] of invalidConfigurations) {
    it(`rejects invalid configuration: ${description}`, () => {
      try {
        getApiConfig(environment);
        throw new Error("Expected getApiConfig() to throw");
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ApiError);

        if (!(error instanceof ApiError)) {
          throw error;
        }

        expect(error.code).toBe("API_CONFIGURATION_ERROR");
      }
    });
  }
});
