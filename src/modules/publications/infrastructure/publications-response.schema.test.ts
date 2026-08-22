import { describe, expect, it } from "vitest";

import { createPublicationsResponse } from "./publications-response.fixture";
import { publicationsResponseSchema } from "./publications-response.schema";

describe("publicationsResponseSchema", () => {
  it("accepts the persisted publications response from NestJS", () => {
    expect(
      publicationsResponseSchema.safeParse(createPublicationsResponse()).success,
    ).toBe(true);
  });

  it("rejects unsupported grouped models", () => {
    const response: unknown = createPublicationsResponse();
    const invalidResponse = structuredClone(response) as {
      products: Array<{ model: string }>;
    };
    const firstPublication = invalidResponse.products[0];

    if (!firstPublication) {
      throw new Error("The fixture must contain a publication");
    }

    firstPublication.model = "UNKNOWN";

    expect(publicationsResponseSchema.safeParse(invalidResponse).success).toBe(
      false,
    );
  });

  it("rejects a response without the real cursor fields", () => {
    const response: unknown = createPublicationsResponse();
    const invalidResponse = structuredClone(response) as {
      nextCursor?: string | null;
    };
    delete invalidResponse.nextCursor;

    expect(publicationsResponseSchema.safeParse(invalidResponse).success).toBe(
      false,
    );
  });

  it("rejects negative grouped product stock", () => {
    const response: unknown = createPublicationsResponse();
    const invalidResponse = structuredClone(response) as {
      products: Array<{ stock: number }>;
    };
    const firstPublication = invalidResponse.products[0];

    if (!firstPublication) {
      throw new Error("The fixture must contain a publication");
    }

    firstPublication.stock = -1;

    expect(publicationsResponseSchema.safeParse(invalidResponse).success).toBe(
      false,
    );
  });
});
