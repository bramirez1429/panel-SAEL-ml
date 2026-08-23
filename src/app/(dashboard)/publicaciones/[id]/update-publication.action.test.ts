// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ update: vi.fn(), refresh: vi.fn() }));
vi.mock("@/modules/publications/publications.composition.server", () => ({
  createUpdatePublicationCommand: () => ({ execute: mocks.update }),
  createGetPublicationByIdQuery: () => ({ execute: mocks.refresh }),
}));

import { updatePublicationAction } from "./update-publication.action";

const input = {
  publicationId: "MLA-1",
  target: { type: "family" as const, familyId: "F1", itemId: "MLA-1" },
  current: { sku: "OLD", price: 10, stock: 2 },
  draft: { sku: "NEW", price: 11, stock: 3 },
};

describe("updatePublicationAction", () => {
  it("confirma la mutación leyendo nuevamente el detalle", async () => {
    mocks.update.mockResolvedValue(true);
    mocks.refresh.mockResolvedValue({ id: "MLA-1" });
    await expect(updatePublicationAction(input)).resolves.toEqual({ ok: true });
    expect(mocks.refresh).toHaveBeenCalledWith("MLA-1");
  });

  it("no lee de nuevo si el comando no detecta cambios", async () => {
    mocks.update.mockResolvedValue(false);
    mocks.refresh.mockClear();
    await expect(updatePublicationAction(input)).resolves.toEqual({ ok: true });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("devuelve error y no confirma datos cuando NestJS rechaza la mutación", async () => {
    mocks.update.mockRejectedValue(new Error("backend failure"));
    mocks.refresh.mockClear();
    await expect(updatePublicationAction(input)).resolves.toMatchObject({ ok: false });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
