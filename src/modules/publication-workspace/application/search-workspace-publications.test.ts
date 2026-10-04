import { describe, expect, it, vi } from "vitest";

import type { PublicationWorkspaceSearchItem } from "../domain/publication-workspace.model";
import type {
  PublicationWorkspaceRepository,
  PublicationWorkspaceSearchCriteria,
} from "../domain/publication-workspace.repository";
import { searchWorkspacePublications } from "./search-workspace-publications";

const activeItem = (itemId: string): PublicationWorkspaceSearchItem => ({
  itemId,
  familyId: "123456789",
  userProductId: null,
  title: `Publicación ${itemId}`,
  imageUrl: null,
  price: 100,
  currency: "ARS",
  status: "active",
  stock: 1,
});

function createRepository(
  items: readonly PublicationWorkspaceSearchItem[],
  criteria: PublicationWorkspaceSearchCriteria,
) {
  const search = vi.fn<PublicationWorkspaceRepository["search"]>().mockResolvedValue({ criteria, items });
  const getById = vi.fn<PublicationWorkspaceRepository["getById"]>();
  const getFamily = vi.fn<PublicationWorkspaceRepository["getFamily"]>();
  const updateTitle = vi.fn<PublicationWorkspaceRepository["updateTitle"]>();
  return { repository: { search, getById, getFamily, updateTitle }, search };
}

describe("searchWorkspacePublications", () => {
  it("consulta un MLA con limit 1", async () => {
    const { repository, search } = createRepository(
      [activeItem("MLA123456789")],
      { type: "MLA", value: "MLA123456789" },
    );

    await searchWorkspacePublications(repository, "mla123456789");

    expect(search).toHaveBeenCalledWith({ query: "MLA123456789", limit: 1 });
  });

  it("conserva todos los hijos activos de una Family ID", async () => {
    const paused = { ...activeItem("MLA1"), status: "paused" };
    const { repository } = createRepository(
      [paused, activeItem("MLA2"), activeItem("MLA3")],
      { type: "FAMILY", value: "118836408244533" },
    );

    const result = await searchWorkspacePublications(repository, "118836408244533");

    expect(result).toMatchObject({
      status: "success",
      searchType: "FAMILY",
      query: "118836408244533",
      items: [
        { itemId: "MLA2", status: "active" },
        { itemId: "MLA3", status: "active" },
      ],
    });
  });

  it("limita a cuatro las coincidencias por título", async () => {
    const { repository, search } = createRepository(
      Array.from({ length: 6 }, (_, index) => activeItem(`MLA${index}`)),
      { type: "TITLE", value: "Remera Miami" },
    );

    const result = await searchWorkspacePublications(repository, "Remera Miami");

    expect(search).toHaveBeenCalledWith({ query: "Remera Miami", limit: 4 });
    expect(result.status === "success" && result.items).toHaveLength(4);
  });

  it("consulta MLAU sin limitar sus asociados y conserva solamente los activos", async () => {
    const { repository, search } = createRepository(
      [
        { ...activeItem("MLA1"), userProductId: "MLAU123" },
        { ...activeItem("MLA2"), userProductId: "MLAU123", status: "paused" },
      ],
      { type: "MLAU", value: "MLAU123" },
    );

    const result = await searchWorkspacePublications(repository, "mlau123");

    expect(search).toHaveBeenCalledWith({ query: "MLAU123", limit: 20 });
    expect(result).toMatchObject({
      status: "success",
      searchType: "MLAU",
      items: [
        { itemId: "MLA1", userProductId: "MLAU123" },
      ],
    });
  });

  it("un resultado vacío sigue siendo una búsqueda exitosa", async () => {
    const { repository } = createRepository([], { type: "MLA", value: "MLA1" });

    const result = await searchWorkspacePublications(repository, "MLA1");

    expect(result).toMatchObject({
      status: "success",
      items: [],
    });
  });

  it("convierte un error real del repositorio en status error", async () => {
    const { repository, search } = createRepository([], { type: "TITLE", value: "Remera" });
    search.mockRejectedValue(new Error("Backend unavailable"));

    await expect(
      searchWorkspacePublications(repository, "Remera"),
    ).resolves.toEqual({ status: "error" });
  });
});
