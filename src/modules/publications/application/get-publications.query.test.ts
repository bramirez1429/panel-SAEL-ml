import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/shared/errors/app-error";

import type { PublicationsPage } from "../domain/publication.model";
import type { PublicationsRepository } from "../domain/publications.repository";
import { GetPublicationsQuery } from "./get-publications.query";

const publicationsPage: PublicationsPage = {
  publications: [],
  page: 1,
  pageSize: 20,
  count: 0,
  total: 0,
  totalPages: 0,
};

describe("GetPublicationsQuery", () => {
  it("returns the domain page provided by its repository", async () => {
    const getPublications = vi
      .fn<PublicationsRepository["getPublications"]>()
      .mockResolvedValue(publicationsPage);
    const query = new GetPublicationsQuery({ getPublications });

    await expect(query.execute()).resolves.toBe(publicationsPage);
    expect(getPublications).toHaveBeenCalledOnce();
  });

  it("propagates controlled repository errors without changing them", async () => {
    const repositoryError = new AppError(
      "No se pudieron obtener las publicaciones.",
      "PUBLICATIONS_UNAVAILABLE",
    );
    const getPublications = vi
      .fn<PublicationsRepository["getPublications"]>()
      .mockRejectedValue(repositoryError);
    const query = new GetPublicationsQuery({ getPublications });

    await expect(query.execute()).rejects.toBe(repositoryError);
  });
});
