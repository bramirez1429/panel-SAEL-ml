// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const mocks = vi.hoisted(() => ({ update: vi.fn(), updateStatus: vi.fn(), getSku: vi.fn(), refresh: vi.fn() }));
vi.mock("@/modules/publications/publications.composition.server", () => ({
  createUpdatePublicationCommand: () => ({ execute: mocks.update, updateStatus: mocks.updateStatus, getSku: mocks.getSku }),
  createGetPublicationByIdQuery: () => ({ execute: mocks.refresh }),
}));

import { updatePublicationAction, updatePublicationStatusAction } from "./update-publication.action";

const input = {
  publicationId: "MLA-1",
  target: { type: "family" as const, familyId: "F1", itemId: "MLA-1" },
  current: { sku: "OLD", price: 10, stock: 2 },
  draft: { sku: "NEW", price: 11, stock: 3 },
};

describe("updatePublicationAction", () => {
  it("confirma el SKU mediante el endpoint específico", async () => {
    mocks.update.mockResolvedValue(true);
    mocks.getSku.mockResolvedValue("NEW");
    mocks.refresh.mockResolvedValue({
      id: "MLA-1", title: "Test", channel: "MERCADO_LIBRE", status: "active", thumbnailUrl: null, permalink: null,
      price: { from: 11, to: 11, currency: null }, stock: 3, sold: 0, attributes: [],
      group: { key: "family:F1", type: "USER_PRODUCT", familyId: "F1", userProductId: "UP1", itemId: "MLA-1", childrenCount: 1 },
      variants: [{ id: "MLA-1", itemId: "MLA-1", userProductId: "UP1", label: null, title: "Test", thumbnailUrl: null, status: "active", price: { amount: 11, currency: null }, stock: 3, sold: 0, sku: "OLD", attributes: [], permalink: null }],
    });
    await expect(updatePublicationAction(input)).resolves.toMatchObject({ ok: true, confirmed: { sku: "NEW" } });
    expect(mocks.getSku).toHaveBeenCalledWith(input.target);
  });

  it("confirma la mutación leyendo nuevamente el detalle", async () => {
    mocks.update.mockResolvedValue(true);
    mocks.refresh.mockResolvedValue({
      id: "MLA-1", title: "Test", channel: "MERCADO_LIBRE", status: "active",
      thumbnailUrl: null, permalink: null, price: { from: 11, to: 11, currency: null },
      stock: 3, sold: 0, attributes: [],
      group: { key: "family:F1", type: "USER_PRODUCT", familyId: "F1", userProductId: "UP1", itemId: "MLA-1", childrenCount: 1 },
      variants: [{ id: "MLA-1", itemId: "MLA-1", userProductId: "UP1", label: null, title: "Test", thumbnailUrl: null, status: "active", price: { amount: 11, currency: null }, stock: 3, sold: 0, sku: "NEW", attributes: [], permalink: null }],
    });
    await expect(updatePublicationAction(input)).resolves.toMatchObject({ ok: true, confirmed: { sku: "NEW", price: 11, stock: 3 } });
    expect(mocks.refresh).toHaveBeenCalledWith("MLA-1");
  });

  it("no lee de nuevo si el comando no detecta cambios", async () => {
    mocks.update.mockResolvedValue(false);
    mocks.refresh.mockClear();
    await expect(updatePublicationAction(input)).resolves.toMatchObject({ ok: true, confirmed: {} });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("devuelve error y no confirma datos cuando NestJS rechaza la mutación", async () => {
    mocks.update.mockRejectedValue(new Error("backend failure"));
    mocks.refresh.mockClear();
    await expect(updatePublicationAction(input)).resolves.toMatchObject({ ok: false });
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("reintenta cuando Mercado Libre propaga el valor con demora", async () => {
    mocks.update.mockResolvedValue(true);
    const stale = { id: "MLA-1", title: "Test", channel: "MERCADO_LIBRE", status: "active", thumbnailUrl: null, permalink: null, price: { from: 10, to: 10, currency: null }, stock: 2, sold: 0, attributes: [], group: { key: "family:F1", type: "USER_PRODUCT", familyId: "F1", userProductId: "UP1", itemId: "MLA-1", childrenCount: 1 }, variants: [{ id: "MLA-1", itemId: "MLA-1", userProductId: "UP1", label: null, title: "Test", thumbnailUrl: null, status: "active", price: { amount: 10, currency: null }, stock: 2, sold: 0, sku: "OLD", attributes: [], permalink: null }] };
    const fresh = { ...stale, price: { from: 11, to: 11, currency: null }, stock: 3, variants: [{ ...stale.variants[0], price: { amount: 11, currency: null }, stock: 3, sku: "NEW" }] };
    mocks.refresh.mockReset().mockResolvedValueOnce(stale).mockResolvedValueOnce(fresh);
    await expect(updatePublicationAction(input)).resolves.toMatchObject({ ok: true, confirmed: { sku: "NEW", price: 11, stock: 3 } });
    expect(mocks.refresh).toHaveBeenCalledTimes(2);
  });

  it("reintenta el estado hasta confirmar paused", async () => {
    mocks.updateStatus.mockResolvedValue(undefined);
    const stale = { id: "MLA-1", title: "Test", channel: "MERCADO_LIBRE", status: "active", thumbnailUrl: null, permalink: null, price: null, stock: 1, sold: 0, attributes: [], group: { key: "item:MLA-1", type: "LEGACY", familyId: null, userProductId: null, itemId: "MLA-1", childrenCount: 0 }, variants: [] };
    const paused = { ...stale, status: "paused" };
    mocks.refresh.mockReset().mockResolvedValueOnce(stale).mockResolvedValueOnce(paused);
    await expect(updatePublicationStatusAction({ publicationId: "MLA-1", target: { type: "legacy", itemId: "MLA-1", variationId: null }, status: "paused" })).resolves.toEqual({ ok: true, confirmed: "paused" });
    expect(mocks.refresh).toHaveBeenCalledTimes(2);
  });
});
