import { describe, expect, it } from "vitest";

import {
  familyPublicationDetailResponse,
  legacyPublicationDetailResponse,
} from "./publication-detail-response.fixture";
import { mapPublicationDetail } from "./publication-detail.mapper";

describe("mapPublicationDetail", () => {
  it("maps a SHARED publication and its real embedded variations", () => {
    const detail = mapPublicationDetail(legacyPublicationDetailResponse);

    expect(detail).toEqual(
      expect.objectContaining({
        id: legacyPublicationDetailResponse.product.id,
        title: "Publicación clásica",
        channel: "MERCADO_LIBRE",
        sold: 4,
        group: expect.objectContaining({ type: "LEGACY" }),
      }),
    );
    expect(detail.variants).toEqual([
      expect.objectContaining({
        id: "1001",
        label: "Azul",
        stock: 3,
        sold: 4,
        attributes: [{ id: "COLOR", value: "Azul" }],
      }),
    ]);
  });

  it("maps a USER_PRODUCT family and its relational children", () => {
    const detail = mapPublicationDetail(familyPublicationDetailResponse);

    expect(detail).toEqual(
      expect.objectContaining({
        title: "Familia real",
        sold: 7,
        group: expect.objectContaining({ type: "USER_PRODUCT" }),
      }),
    );
    expect(detail.variants).toEqual([
      expect.objectContaining({
        itemId: "MLA200",
        userProductId: "MLAU200",
        label: "Azul / 42",
        price: { amount: 1500, currency: "ARS" },
        stock: 2,
        sold: 7,
        attributes: [
          { id: "COLOR", value: "Azul" },
          { id: "SIZE", value: "42" },
        ],
      }),
    ]);
  });

  it("does not invent sold units when a SHARED publication has no variations", () => {
    const detail = mapPublicationDetail({
      ...legacyPublicationDetailResponse,
      product: {
        ...legacyPublicationDetailResponse.product,
        shared_variations: [],
      },
    });

    expect(detail.sold).toBeNull();
    expect(detail.variants).toEqual([]);
  });
});
