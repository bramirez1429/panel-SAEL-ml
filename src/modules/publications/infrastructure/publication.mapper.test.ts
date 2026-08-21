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
});
