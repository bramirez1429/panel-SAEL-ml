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
    updateStatus: vi.fn(),
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

  it("agrega contexto de operación y conserva el mensaje del backend", async () => {
    const repo = repository();
    vi.mocked(repo.updateStock).mockRejectedValue(new Error("variationId inválido"));
    await expect(new UpdatePublicationCommand(repo).execute({ publicationId: "MLA-1", target, current, draft: { price: 10, stock: 4, sku: "OLD" } })).rejects.toThrow("No se pudo actualizar stock: variationId inválido");
  });

  it.each([
    ["stock", { price: 10, stock: 5, sku: "OLD" }],
    ["sku", { price: 10, stock: 2, sku: "NEW" }],
    ["price", { price: 11, stock: 2, sku: "OLD" }],
    ["stock + sku", { price: 10, stock: 5, sku: "NEW" }],
    ["price + stock", { price: 11, stock: 5, sku: "OLD" }],
    ["price + sku", { price: 11, stock: 2, sku: "NEW" }],
    ["price + stock + sku", { price: 11, stock: 5, sku: "NEW" }],
  ])("envía sólo la combinación modificada: %s", async (_label, draft) => {
    const repo = repository();
    await new UpdatePublicationCommand(repo).execute({ publicationId: "MLA-1", target, current, draft });
    expect(repo.updatePrice).toHaveBeenCalledTimes(draft.price === current.price ? 0 : 1);
    expect(repo.updateStock).toHaveBeenCalledTimes(draft.stock === current.stock ? 0 : 1);
    expect(repo.updateSku).toHaveBeenCalledTimes(draft.sku === current.sku ? 0 : 1);
  });

  it("permite stock-only cuando el SKU actual es null", async () => {
    const repo = repository();
    await new UpdatePublicationCommand(repo).execute({ publicationId: "MLA-1", target, current: { price: 10, stock: 2, sku: null }, draft: { price: 10, stock: 5, sku: "" } });
    expect(repo.updateStock).toHaveBeenCalledWith(target, 5);
    expect(repo.updateSku).not.toHaveBeenCalled();
  });
});
