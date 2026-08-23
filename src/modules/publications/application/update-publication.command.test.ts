import { describe, expect, it, vi } from "vitest";

import type { PublicationEditRepository } from "../domain/publication-edit.repository";
import { UpdatePublicationCommand } from "./update-publication.command";

const target = { type: "family" as const, familyId: "family-1", itemId: "MLA-1" };
const current = { price: 10, stock: 2, sku: "OLD" };

function repository(): PublicationEditRepository {
  return {
    updatePrice: vi.fn(),
    updateStock: vi.fn(),
    updateSku: vi.fn(),
  };
}

describe("UpdatePublicationCommand", () => {
  it("envía sólo los campos modificados", async () => {
    const repo = repository();
    await new UpdatePublicationCommand(repo).execute({
      publicationId: "MLA-1",
      target,
      current,
      draft: { price: 12, stock: 2, sku: "OLD" },
    });
    expect(repo.updatePrice).toHaveBeenCalledWith(target, 12);
    expect(repo.updateStock).not.toHaveBeenCalled();
    expect(repo.updateSku).not.toHaveBeenCalled();
  });

  it("no llama al backend si no hay cambios", async () => {
    const repo = repository();
    await expect(new UpdatePublicationCommand(repo).execute({ publicationId: "MLA-1", target, current, draft: current })).resolves.toBe(false);
    expect(repo.updatePrice).not.toHaveBeenCalled();
  });

  it.each([
    { price: 0, stock: 2, sku: "OLD" },
    { price: 10, stock: -1, sku: "OLD" },
    { price: 10, stock: 1.5, sku: "OLD" },
    { price: 10, stock: 2, sku: "   " },
  ])("rechaza datos inválidos: %o", async (draft) => {
    await expect(new UpdatePublicationCommand(repository()).execute({ publicationId: "MLA-1", target, current, draft })).rejects.toThrow();
  });
});
