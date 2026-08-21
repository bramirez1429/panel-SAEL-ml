import { describe, expect, it } from "vitest";

import { createPublicationsResponse } from "./publications-response.fixture";
import { publicationsResponseSchema } from "./publications-response.schema";

describe("publicationsResponseSchema", () => {
  it("accepts the persisted publications response from NestJS", () => {
    expect(
      publicationsResponseSchema.safeParse(createPublicationsResponse()).success,
    ).toBe(true);
  });

  it("rejects unsupported transport models", () => {
    const response: unknown = createPublicationsResponse();
    const invalidResponse = structuredClone(response) as {
      publications: Array<{ model: string }>;
    };
    const firstPublication = invalidResponse.publications[0];

    if (!firstPublication) {
      throw new Error("The fixture must contain a publication");
    }

    firstPublication.model = "UNKNOWN";

    expect(publicationsResponseSchema.safeParse(invalidResponse).success).toBe(
      false,
    );
  });

  it("rejects invalid persistence timestamps", () => {
    const response: unknown = createPublicationsResponse();
    const invalidResponse = structuredClone(response) as {
      publications: Array<{ updated_at: string }>;
    };
    const firstPublication = invalidResponse.publications[0];

    if (!firstPublication) {
      throw new Error("The fixture must contain a publication");
    }

    firstPublication.updated_at = "not-a-timestamp";

    expect(publicationsResponseSchema.safeParse(invalidResponse).success).toBe(
      false,
    );
  });
});
