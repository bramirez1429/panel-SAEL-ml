import { describe, expect, it } from "vitest";

import {
  familyDetailResponse,
  familyPublicationDetailResponse,
  legacyPublicationDetailResponse,
} from "./publication-detail-response.fixture";
import {
  familyDetailResponseSchema,
  publicationDetailResponseSchema,
} from "./publication-detail-response.schema";

describe("publicationDetailResponseSchema", () => {
  it("accepts the active SHARED response", () => {
    expect(
      publicationDetailResponseSchema.safeParse(
        legacyPublicationDetailResponse,
      ).success,
    ).toBe(true);
  });

  it("accepts the active VARIANT_PRICING response", () => {
    expect(
      publicationDetailResponseSchema.safeParse(
        familyPublicationDetailResponse,
      ).success,
    ).toBe(true);
  });

  it("accepts the real family detail response with child items", () => {
    expect(familyDetailResponseSchema.safeParse(familyDetailResponse).success).toBe(
      true,
    );
  });

  it("rejects an invalid stock quantity", () => {
    const invalidResponse = {
      ...legacyPublicationDetailResponse,
      stock: { available: -1, sold: 2 },
    };

    expect(publicationDetailResponseSchema.safeParse(invalidResponse).success).toBe(
      false,
    );
  });
});
