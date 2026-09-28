import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  search: vi.fn(),
}));

vi.mock("../publication-workspace.composition.server", () => ({
  createPublicationWorkspaceRepository: () => ({
    search: mocks.search,
    getById: vi.fn(),
    getFamily: vi.fn(),
    updateTitle: vi.fn(),
  }),
}));

import { searchWorkspacePublicationsAction } from "./publication-workspace.actions";

describe("searchWorkspacePublicationsAction", () => {
  it("no deja escapar errores de consulta hasta el cliente", async () => {
    mocks.search.mockRejectedValueOnce(new Error("Backend unavailable"));

    await expect(
      searchWorkspacePublicationsAction("118836408244533"),
    ).resolves.toEqual({ status: "error" });
  });
});
