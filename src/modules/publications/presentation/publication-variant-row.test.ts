import { describe, expect, it } from "vitest";

import type { PublicationDetail } from "../domain/publication.model";
import { createPublicationVariantRows, getAttributeValue, groupFamilyRows, compareSizes, compareRows } from "./publication-variant-row";
import { toEditTarget } from "./publication-variants-table.client";

const base: PublicationDetail = {
  id: "MLA100",
  title: "Publicación",
  channel: "MERCADO_LIBRE",
  status: "active",
  thumbnailUrl: null,
  pictures: [],
  permalink: null,
  price: { from: 1000, to: 1000, currency: "ARS" },
  stock: 3,
  sold: 2,
  attributes: [{ id: "COLOR", value: "Negro" }, { id: "SIZE", value: "M" }, { id: "SELLER_SKU", value: "SKU-1" }],
  group: {
    key: "family:1",
    type: "USER_PRODUCT",
    familyId: "1",
    userProductId: "UP-1",
    itemId: null,
    childrenCount: 1,
  },
  variants: [],
};

describe("publication variant rows", () => {
  it("maps only COLOR and SIZE attributes", () => {
    const rows = createPublicationVariantRows(base);
    expect(rows[0]).toMatchObject({ color: "Negro", size: "M" });
    expect(rows[0]?.sku).toBe("SKU-1");
    expect(getAttributeValue([{ id: "SELLER_PACKAGE", value: "x" }], "COLOR")).toBeNull();
  });

  it("uses a main row when a legacy publication has no variations", () => {
    const rows = createPublicationVariantRows({
      ...base,
      group: { ...base.group, type: "LEGACY", familyId: null },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.publicationId).toBe("MLA100");
  });

  it("agrupa las ofertas MLA por userProductId sin perder sus precios", () => {
    const rows = createPublicationVariantRows({
      ...base,
      variants: [
        { id: "MLA1", itemId: "MLA1", userProductId: "MLAU1", label: null, title: null, thumbnailUrl: null, pictures: [], status: "active", price: { amount: 50, currency: null }, stock: 2, sold: 1, sku: "SKU", attributes: [{ id: "COLOR", value: "Negro" }, { id: "SIZE", value: "38" }], permalink: null },
        { id: "MLA2", itemId: "MLA2", userProductId: "MLAU1", label: null, title: null, thumbnailUrl: null, pictures: [], status: "active", price: { amount: 38, currency: null }, stock: 2, sold: 1, sku: "SKU", attributes: [{ id: "COLOR", value: "Negro" }, { id: "SIZE", value: "38" }], permalink: null },
      ],
    });
    expect(groupFamilyRows(rows)).toHaveLength(1);
    expect(groupFamilyRows(rows)[0]?.offers.map((row) => row.price?.amount)).toEqual([50, 38]);
  });

  it("ordena talles numéricos y alfanuméricos sin romperse", () => {
    expect(compareSizes("38", "40")).toBeLessThan(0);
    expect(compareSizes("M", "XL")).toBeLessThan(0);
    expect(compareRows({ ...createPublicationVariantRows(base)[0]!, size: "42" }, { ...createPublicationVariantRows(base)[0]!, size: "38" })).toBeGreaterThan(0);
  });

  it("determina el target por publicationType, no por familyId", () => {
    const row = { ...createPublicationVariantRows(base)[0]!, publicationType: "USER_PRODUCT" as const, familyId: null };
    expect(() => toEditTarget(row)).toThrow("familyId");
    expect(toEditTarget({ ...row, publicationType: "LEGACY", variationId: 12 })).toMatchObject({ type: "legacy", variationId: 12 });
  });
});
