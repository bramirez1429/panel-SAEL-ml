import { describe, expect, it } from "vitest";

import { mapPublicationsResponse } from "./publication.mapper";
import {
  createPublicationsResponse,
  legacyPublicationDto,
  userProductPublicationDto,
} from "./publications-response.fixture";

describe("mapPublicationsResponse", () => {
  it("maps shared products and grouped families to domain publications", () => {
    const result = mapPublicationsResponse(
      createPublicationsResponse([
        legacyPublicationDto,
        userProductPublicationDto,
      ]),
    );

    expect(result.publications).toEqual([
      expect.objectContaining({
        id: "MLA100",
        title: "Publicación clásica",
        channel: "MERCADO_LIBRE",
        sold: 2,
        price: { from: 1000, to: 1000, currency: null },
        group: expect.objectContaining({ type: "LEGACY" }),
      }),
      expect.objectContaining({
        id: "MLA200",
        title: "Familia real",
        stock: 3,
        sold: 10,
        price: { from: 1500, to: 1700, currency: null },
        group: expect.objectContaining({
          type: "USER_PRODUCT",
          familyId: "200",
          childrenCount: 2,
        }),
      }),
    ]);
    expect(result.productsCount).toBe(2);
    expect(result.done).toBe(true);
    expect(result.publications[1]?.variants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ itemId: "MLA200", userProductId: "MLAU200", stock: 2 }),
      ]),
    );
  });

  it("preserves the absence of price data", () => {
    const result = mapPublicationsResponse(
      createPublicationsResponse([{ ...legacyPublicationDto, price: null }]),
    );

    expect(result.publications[0]).toEqual(
      expect.objectContaining({ price: null, stock: 5, sold: 2 }),
    );
  });

  it("conserva variations clásicas con stock, vendidos y SKU", () => {
    const result = mapPublicationsResponse(createPublicationsResponse([{ ...legacyPublicationDto, variations: [{ id: 123, available_quantity: 4, sold_quantity: 9, price: 1100, attribute_combinations: [{ id: "COLOR", value_name: "Negro" }, { id: "SIZE", value_name: "M" }], attributes: [{ id: "SELLER_SKU", value_name: "SKU-M" }] }] }]));
    expect(result.publications[0]?.variants?.[0]).toMatchObject({ id: "123", stock: 4, sold: 9, sku: "SKU-M" });
  });
});
