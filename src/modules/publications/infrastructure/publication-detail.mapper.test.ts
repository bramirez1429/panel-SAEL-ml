import { describe, expect, it } from "vitest";

import {
  familyDetailResponse,
  familyPublicationDetailResponse,
  legacyPublicationDetailResponse,
} from "./publication-detail-response.fixture";
import { mapPublicationDetail } from "./publication-detail.mapper";

describe("mapPublicationDetail", () => {
  it("maps the active SHARED response without inventing variations", () => {
    const detail = mapPublicationDetail(legacyPublicationDetailResponse);

    expect(detail).toEqual(
      expect.objectContaining({
        id: "MLA100",
        title: "Publicación clásica",
        channel: "MERCADO_LIBRE",
        sold: 2,
        group: expect.objectContaining({ type: "LEGACY" }),
      }),
    );
    expect(detail.variants).toEqual([]);
  });

  it("maps the active VARIANT_PRICING response", () => {
    const detail = mapPublicationDetail(
      familyPublicationDetailResponse,
      familyDetailResponse,
    );

    expect(detail).toEqual(
      expect.objectContaining({
        id: "MLA200",
        title: "Familia real",
        sold: 7,
        group: expect.objectContaining({
          type: "USER_PRODUCT",
          familyId: "200",
        }),
      }),
    );
    expect(detail.group.childrenCount).toBe(2);
    expect(detail.variants.map((variant) => variant.itemId)).toEqual([
      "MLA201",
      "MLA202",
    ]);
    expect(detail.variants[0]?.attributes).toEqual([
      { id: "COLOR", value: "Azul" },
    ]);
  });
});
