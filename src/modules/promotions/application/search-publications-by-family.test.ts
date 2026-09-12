import { describe, expect, it, vi } from "vitest";

import { searchPublicationsByFamily } from "./search-publications-by-family";

describe("searchPublicationsByFamily", () => {
  it("usa sin cambios la búsqueda global del catálogo de Promociones", async () => {
    const result = { publications: [], done: true, nextCursor: null, count: 0 };
    const repository = { getCatalog: vi.fn().mockResolvedValue(result) };

    await expect(searchPublicationsByFamily(
      repository,
      "7452953254396627",
      { limit: 20, cursor: null },
    )).resolves.toBe(result);

    expect(repository.getCatalog).toHaveBeenCalledWith({
      limit: 20,
      cursor: null,
      search: "7452953254396627",
    });
  });
});
