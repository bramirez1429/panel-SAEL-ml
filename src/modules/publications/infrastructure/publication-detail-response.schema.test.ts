import { describe, expect, it } from "vitest";

import {
  familyPublicationDetailResponse,
  legacyPublicationDetailResponse,
} from "./publication-detail-response.fixture";
import { publicationDetailResponseSchema } from "./publication-detail-response.schema";

describe("publicationDetailResponseSchema", () => {
  it("accepts the real SHARED response with its embedded variations", () => {
    expect(
      publicationDetailResponseSchema.safeParse(
        legacyPublicationDetailResponse,
      ).success,
    ).toBe(true);
  });

  it("accepts the real VARIANT_PRICING response with relational children", () => {
    expect(
      publicationDetailResponseSchema.safeParse(
        familyPublicationDetailResponse,
      ).success,
    ).toBe(true);
  });

  it("requires children for a VARIANT_PRICING product", () => {
    const responseWithoutChildren = {
      product: familyPublicationDetailResponse.product,
    };

    expect(
      publicationDetailResponseSchema.safeParse(responseWithoutChildren)
        .success,
    ).toBe(false);
  });

  it("rejects invalid external quantities", () => {
    const invalidResponse = {
      ...legacyPublicationDetailResponse,
      product: {
        ...legacyPublicationDetailResponse.product,
        shared_variations: [
          {
            ...legacyPublicationDetailResponse.product.shared_variations[0],
            soldQuantity: -1,
          },
        ],
      },
    };

    expect(publicationDetailResponseSchema.safeParse(invalidResponse).success).toBe(
      false,
    );
  });
});
