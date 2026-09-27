import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { HttpGetClient } from "@/shared/api/http-client.server";

import { PublicationWorkspaceApiRepository } from "./publication-workspace-api.repository.server";

describe("PublicationWorkspaceApiRepository", () => {
  it("usa el endpoint direct search con sus query params", async () => {
    const get = vi.fn<HttpGetClient["get"]>().mockResolvedValue({
      criteria: { type: "MLA", value: "MLA123" },
      done: true,
      nextCursor: null,
      itemsCount: 1,
      items: [{
        itemId: "MLA123",
        familyId: null,
        userProductId: null,
        title: "Remera",
        thumbnail: null,
        price: 100,
        currencyId: "ARS",
        status: "active",
        stock: 2,
        sold: 1,
        permalink: null,
        model: "SHARED",
      }],
    });

    const result = await new PublicationWorkspaceApiRepository({ get, patch: vi.fn() }).search({
      query: "MLA123",
      limit: 1,
    });

    expect(get).toHaveBeenCalledWith(
      "/mercadolibre/direct/publicaciones/search?q=MLA123&limit=1",
    );
    expect(result).toEqual([
      expect.objectContaining({ itemId: "MLA123", status: "active" }),
    ]);
  });

  it("conserva todos los hijos devueltos por una Family ID", async () => {
    const get = vi.fn<HttpGetClient["get"]>().mockResolvedValue({
      criteria: { type: "FAMILY", value: "4998600864813595" },
      done: true,
      nextCursor: null,
      itemsCount: 3,
      items: [
        searchItem("MLA1", "MLAU1", "active"),
        searchItem("MLA2", "MLAU2", "paused"),
        searchItem("MLA3", "MLAU3", "active"),
      ],
    });

    const result = await new PublicationWorkspaceApiRepository({
      get,
      patch: vi.fn(),
    }).search({ query: "4998600864813595", limit: 4 });

    expect(result.map(({ itemId }) => itemId)).toEqual([
      "MLA1",
      "MLA2",
      "MLA3",
    ]);
    expect(result[1]).toMatchObject({
      userProductId: "MLAU2",
      status: "paused",
    });
  });

  it("interpreta un userProductId faltante como null", async () => {
    const itemWithoutUserProductId = searchItem(
      "MLA1",
      "MLAU1",
      "active",
    );
    const { userProductId: _omitted, ...legacyItem } =
      itemWithoutUserProductId;
    const get = vi.fn<HttpGetClient["get"]>().mockResolvedValue({
      criteria: { type: "FAMILY", value: "4998600864813595" },
      done: true,
      nextCursor: null,
      itemsCount: 1,
      items: [legacyItem],
    });

    await expect(
      new PublicationWorkspaceApiRepository({
        get,
        patch: vi.fn(),
      }).search({ query: "4998600864813595", limit: 4 }),
    ).resolves.toEqual([
      expect.objectContaining({
        itemId: "MLA1",
        userProductId: null,
      }),
    ]);
  });

  it("usa la primera secure_url del detalle como imagen principal", async () => {
    const get = vi.fn<HttpGetClient["get"]>().mockResolvedValue({
      model: "VARIANT_PRICING",
      itemId: "MLA123",
      title: "Remera",
      familyId: "456",
      status: "active",
      sku: "SKU-1",
      stock: { available: 2, sold: 7 },
      price: commercialPrice(),
      friendly: commercialFriendly(true, 20),
      installmentLabel: "6 cuotas",
      thumbnail: "https://img/thumbnail.jpg",
      pictures: [{
        secure_url: "https://img/secure.jpg",
        url: "http://img/image.jpg",
      }],
    });

    const result = await new PublicationWorkspaceApiRepository({ get, patch: vi.fn() }).getById(
      "MLA123",
    );

    expect(get).toHaveBeenCalledWith(
      "/mercadolibre/direct/publicaciones/MLA123",
    );
    expect(result.imageUrl).toBe("https://img/secure.jpg");
    expect(result).toMatchObject({
      price: 45_000,
      sold: 7,
      hasActivePromotion: true,
      promotionDiscountPercent: 20,
      installmentLabel: "6 cuotas",
    });
  });

  it("mapea los datos comerciales de todos los MLA desde el detalle de familia", async () => {
    const get = vi.fn<HttpGetClient["get"]>().mockResolvedValue({
      model: "VARIANT_PRICING",
      familyId: "456",
      familyName: "Remeras Miami",
      itemsCount: 2,
      variants: [
        familyChild("MLA1", "active", true),
        familyChild("MLA2", "paused", false),
      ],
    });

    const result = await new PublicationWorkspaceApiRepository({ get, patch: vi.fn() }).getFamily("456");

    expect(get).toHaveBeenCalledWith("/mercadolibre/direct/familias/456");
    expect(result.children).toEqual([
      expect.objectContaining({
        itemId: "MLA1",
        sku: "SKU-MLA1",
        price: 45_000,
        sold: 12,
        hasActivePromotion: true,
        promotionDiscountPercent: 20,
        installmentLabel: "6 cuotas",
      }),
      expect.objectContaining({
        itemId: "MLA2",
        sku: "SKU-MLA2",
        sold: 4,
        hasActivePromotion: false,
      }),
    ]);
  });
});

function familyChild(itemId: string, status: string, promoted: boolean) {
  return {
    itemId,
    userProductId: `MLAU-${itemId}`,
    title: `Remera ${itemId}`,
    status,
    stock: { available: 2, sold: itemId === "MLA1" ? 12 : 4 },
    sku: { sellerCustomField: `SKU-${itemId}`, inventoryId: null },
    price: commercialPrice(),
    friendly: commercialFriendly(promoted, promoted ? 20 : 0),
    installmentLabel: promoted ? "6 cuotas" : null,
    thumbnail: null,
    pictures: [],
  };
}

function commercialPrice() {
  return {
    current: 45_000,
    regular: 56_250,
    standard: 56_250,
    currency: "ARS",
  };
}

function commercialFriendly(hasPromotion: boolean, discountPercent: number) {
  return {
    pricing: {
      ...commercialPrice(),
      hasDiscount: discountPercent > 0,
      discountPercent,
    },
    promotion: {
      hasActivePromotion: hasPromotion,
      activeCount: hasPromotion ? 1 : 0,
      candidateCount: 0,
      pendingCount: 0,
    },
  };
}

function searchItem(itemId: string, userProductId: string, status: string) {
  return {
    itemId,
    familyId: "4998600864813595",
    userProductId,
    title: `Remera ${itemId}`,
    thumbnail: null,
    price: 100,
    currencyId: "ARS",
    status,
    stock: 2,
    sold: 1,
    permalink: null,
    model: "VARIANT_PRICING",
  };
}
