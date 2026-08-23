import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/shared/errors/app-error";

import type {
  Publication,
  PublicationsPage,
} from "../domain/publication.model";
import type { PublicationsRepository } from "../domain/publications.repository";
import {
  GetPublicationsQuery,
  type GetPublicationsQueryInput,
} from "./get-publications.query";

const legacyPublication: Publication = {
  id: "legacy-id",
  title: "Publicación clásica",
  channel: "MERCADO_LIBRE",
  status: "active",
  thumbnailUrl: null,
  permalink: "https://example.com/MLA100",
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
};

const familyPublication: Publication = {
  ...legacyPublication,
  id: "family-id",
  title: "Familia real",
  status: "paused",
  group: {
    key: "family:200",
    type: "USER_PRODUCT",
    familyId: "200",
    userProductId: "UP-200",
    itemId: null,
    childrenCount: 3,
  },
};

const publicationsPage: PublicationsPage = {
  publications: [legacyPublication, familyPublication],
  page: 2,
  pageSize: 20,
  cursor: "cursor-2",
  nextCursor: "cursor-3",
  done: false,
  count: 2,
  productsCount: 2,
};

const defaultInput: GetPublicationsQueryInput = {
  page: 2,
  pageSize: 20,
  cursor: "cursor-2",
  search: "",
  type: null,
  status: null,
};

describe("GetPublicationsQuery", () => {
  it("requests the selected backend page through the repository", async () => {
    const getPublications = vi
      .fn<PublicationsRepository["getPublications"]>()
      .mockResolvedValue(publicationsPage);
    const query = new GetPublicationsQuery(createRepository(getPublications));

    await expect(query.execute(defaultInput)).resolves.toEqual(publicationsPage);
    expect(getPublications).toHaveBeenCalledWith({
      pageSize: 20,
      cursor: "cursor-2",
    });
  });

  it("applies case-insensitive search to the fetched page", async () => {
    const getPublications = vi
      .fn<PublicationsRepository["getPublications"]>()
      .mockResolvedValue(publicationsPage);
    const query = new GetPublicationsQuery(createRepository(getPublications));

    const result = await query.execute({
      ...defaultInput,
      search: "  FAMILIA  ",
    });

    expect(result.publications).toEqual([familyPublication]);
    expect(result.count).toBe(1);
    expect(result.productsCount).toBe(2);
  });

  it("combines type and status filters on the fetched page", async () => {
    const getPublications = vi
      .fn<PublicationsRepository["getPublications"]>()
      .mockResolvedValue(publicationsPage);
    const query = new GetPublicationsQuery(createRepository(getPublications));

    const matching = await query.execute({
      ...defaultInput,
      type: "USER_PRODUCT",
      status: "paused",
    });
    const notMatching = await query.execute({
      ...defaultInput,
      type: "LEGACY",
      status: "paused",
    });

    expect(matching.publications).toEqual([familyPublication]);
    expect(notMatching.publications).toEqual([]);
    expect(notMatching.count).toBe(0);
  });

  it("propagates controlled repository errors without changing them", async () => {
    const repositoryError = new AppError(
      "No se pudieron obtener las publicaciones.",
      "PUBLICATIONS_UNAVAILABLE",
    );
    const getPublications = vi
      .fn<PublicationsRepository["getPublications"]>()
      .mockRejectedValue(repositoryError);
    const query = new GetPublicationsQuery(createRepository(getPublications));

    await expect(query.execute(defaultInput)).rejects.toBe(repositoryError);
  });
});

function createRepository(
  getPublications: PublicationsRepository["getPublications"],
): PublicationsRepository {
  return {
    getPublications,
    getById: vi.fn<PublicationsRepository["getById"]>(),
  };
}
