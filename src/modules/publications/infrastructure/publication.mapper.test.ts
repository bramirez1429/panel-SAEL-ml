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
  });

  it("preserves the absence of price data", () => {
    const result = mapPublicationsResponse(
      createPublicationsResponse([{ ...legacyPublicationDto, price: null }]),
    );

    expect(result.publications[0]).toEqual(
      expect.objectContaining({ price: null, stock: 5, sold: 2 }),
    );
  });
});
