import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api/api-error";

import type { PublicationDetail } from "../domain/publication.model";
import type { PublicationsRepository } from "../domain/publications.repository";
import { GetPublicationByIdQuery } from "./get-publication-by-id.query";

const publication: PublicationDetail = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Publicación clásica",
  channel: "MERCADO_LIBRE",
  status: "active",
  thumbnailUrl: null,
  permalink: null,
  price: { from: 1000, to: 1000, currency: "ARS" },
  stock: 5,
  sold: 2,
  attributes: [],
  group: {
    key: "item:MLA100",
    type: "LEGACY",
    familyId: null,
    userProductId: null,
    itemId: "MLA100",
    childrenCount: 0,
  },
  variants: [],
};

function createRepository(
  getById: PublicationsRepository["getById"],
): PublicationsRepository {
  return {
    getById,
    getPublications: vi.fn<PublicationsRepository["getPublications"]>(),
  };
}

describe("GetPublicationByIdQuery", () => {
  it("obtains a publication through the repository contract", async () => {
    const getById = vi
      .fn<PublicationsRepository["getById"]>()
      .mockResolvedValue(publication);
    const query = new GetPublicationByIdQuery(createRepository(getById));

    await expect(query.execute(publication.id)).resolves.toBe(publication);
    expect(getById).toHaveBeenCalledWith(publication.id);
  });

  it("preserves a controlled repository error", async () => {
    const notFoundError = new ApiError(
      "El backend respondió con HTTP 404.",
      "API_HTTP_ERROR",
      { status: 404 },
    );
    const getById = vi
      .fn<PublicationsRepository["getById"]>()
      .mockRejectedValue(notFoundError);
    const query = new GetPublicationByIdQuery(createRepository(getById));

    await expect(query.execute(publication.id)).rejects.toBe(notFoundError);
  });
});
