import { describe, expect, it } from "vitest";

import { mapPublicationsResponse } from "./publication.mapper";
import {
  createPublicationsResponse,
  legacyPublicationDto,
  userProductPublicationDto,
} from "./publications-response.fixture";

describe("mapPublicationsResponse", () => {
  it("maps backend models to frontend publication types", () => {
    const result = mapPublicationsResponse(
      createPublicationsResponse([
        legacyPublicationDto,
        userProductPublicationDto,
      ]),
    );

    expect(result.publications).toEqual([
      expect.objectContaining({
        title: "Publicación clásica",
        channel: "MERCADO_LIBRE",
        price: {
          from: 1000,
          to: 1000,
          currency: "ARS",
        },
        stock: 5,
        permalink: "https://example.com/MLA100",
        group: expect.objectContaining({
          type: "LEGACY",
          itemId: "MLA100",
          familyId: null,
        }),
      }),
      expect.objectContaining({
        title: "Familia real",
        channel: "MERCADO_LIBRE",
        group: expect.objectContaining({
          type: "USER_PRODUCT",
          itemId: null,
          familyId: "200",
          childrenCount: 3,
        }),
      }),
    ]);
    expect(result.total).toBe(2);
  });

  it("preserves the absence of price data instead of inventing a value", () => {
    const result = mapPublicationsResponse(
      createPublicationsResponse([
        {
          ...legacyPublicationDto,
          price_from: null,
          price_to: null,
        },
      ]),
    );

    expect(result.publications[0]).toEqual(
      expect.objectContaining({ price: null, stock: 5 }),
    );
  });
});
