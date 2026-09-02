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

  it("parses all real pictures and keeps secure URL data", () => {
    const parsed = familyDetailResponseSchema.parse(familyDetailResponse);

    expect(parsed.variants[0]?.pictures).toEqual([
      {
        id: "BLUE-1",
        url: "http://example.com/blue-1.jpg",
        secure_url: "https://example.com/blue-1.jpg",
      },
      { id: "BLUE-2", url: "https://example.com/blue-2.jpg" },
    ]);
  });

  it("falls back to an empty pictures collection when the field is absent", () => {
    const withoutPictures: { pictures?: unknown } & Record<string, unknown> = {
      ...legacyPublicationDetailResponse,
    };
    delete withoutPictures.pictures;

    expect(publicationDetailResponseSchema.parse(withoutPictures).pictures).toEqual([]);
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
