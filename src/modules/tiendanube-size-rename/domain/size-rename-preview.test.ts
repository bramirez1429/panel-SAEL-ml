import { describe, expect, it } from "vitest";
import type { TiendanubeProduct } from "@/modules/tiendanube/domain/tiendanube-products.model";
import { availableSizes, previewSizeChanges } from "./size-rename-preview";

function product(
  id: string,
  variants: { id: string; size: string | null; color: string | null }[],
): TiendanubeProduct {
  return {
    id,
    name: "Buzo frizado " + id,
    imageUrl: null,
    status: "visible",
    tags: ["buzos"],
    variants: variants.map((variant) => ({
      ...variant,
      sku: "SKU-" + variant.id,
      stock: 12,
      price: 32000,
      promotionalPrice: 28000,
    })),
  };
}

describe("previewSizeChanges", () => {
  it("previsualiza equivalencias masivas conservando datos originales y sin mutar productos", () => {
    const products = [product("p1", [
      { id: "v1", size: "40", color: "Negro" },
      { id: "v2", size: "42", color: "Negro" },
      { id: "v3", size: "46", color: "Negro" },
    ])];
    const preview = previewSizeChanges(products, {
      "40": "S/M",
      "42": "L",
      "46": "XL/2XL",
    });
    expect(preview.changes).toHaveLength(3);
    expect(preview.changes.map((row) => row.newSize)).toEqual(["S/M", "L", "XL/2XL"]);
    expect(preview.warnings).toEqual([]);
    expect(products[0]?.variants[0]?.size).toBe("40");
    expect(products[0]?.variants[0]?.price).toBe(32000);
  });

  it("omite talles sin cambios y detecta colisiones por color y talle", () => {
    const products = [product("p2", [
      { id: "v1", size: "40", color: "Negro" },
      { id: "v2", size: "S/M", color: "Negro" },
      { id: "v3", size: "S/M", color: "Blanco" },
    ])];
    const preview = previewSizeChanges(products, { "40": "S/M" });
    expect(preview.changes).toHaveLength(1);
    expect(preview.warnings).toHaveLength(1);
    expect(preview.warnings[0]).toContain("duplicados");
  });

  it("advierte talles vacíos y muestra los talles encontrados", () => {
    const products = [product("p3", [
      { id: "a", size: "S", color: "Negro" },
      { id: "b", size: "M", color: "Negro" },
      { id: "c", size: "XL", color: "Blanco" },
      { id: "d", size: null, color: null },
    ])];
    expect(availableSizes(products)).toEqual(["M", "S", "XL"]);
    const preview = previewSizeChanges(products, { "S": "" });
    expect(preview.warnings).toHaveLength(1);
    expect(preview.changes).toHaveLength(0);
  });
});
