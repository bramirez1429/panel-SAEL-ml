import { describe, expect, it } from "vitest";
import type { TiendanubeProduct } from "@/modules/tiendanube/domain/tiendanube-products.model";
import { planStockUpdates, visibleUniqueSizes } from "./stock-by-size";

const products: TiendanubeProduct[] = [
  {
    id: "100", name: "Buzo de mujer negro", status: "visible",
    imageUrl: null, tags: [], variants: [
      { id: "1", size: "S", color: "Negro", sku: "B1", stock: 0, price: 200, promotionalPrice: null },
      { id: "2", size: "M", color: "Negro", sku: "B2", stock: 4, price: 200, promotionalPrice: null },
      { id: "3", size: "S", color: "Gris", sku: "B3", stock: 0, price: 200, promotionalPrice: null },
      { id: "4", size: "XL", color: "Gris", sku: "B4", stock: 4, price: 200, promotionalPrice: null, visible: false },
    ],
  },
  {
    id: "101", name: "Buzo oculto", status: "hidden",
    imageUrl: null, tags: [], variants: [
      { id: "9", size: "2XL", color: "Marrón", sku: "B9", stock: 0, price: 200, promotionalPrice: null },
    ],
  },
  {
    id: "102", name: "Buzo sin listar", status: "unlisted",
    imageUrl: null, tags: [], variants: [
      { id: "10", size: "L", color: "Marrón", sku: "B10", stock: 0, price: 200, promotionalPrice: null },
    ],
  },
];

describe("stock global por talle", () => {
  it("muestra una sola vez cada talle visible sin excluir stock cero", () => {
    expect(visibleUniqueSizes(products)).toEqual([
      { key: "M", size: "M", variants: 1, noStock: 0, colors: ["Negro"], stockValues: [4] },
      { key: "S", size: "S", variants: 2, noStock: 2, colors: ["Gris", "Negro"], stockValues: [0] },
    ]);
  });

  it("input vacío no impacta, cero sí; no toca invisibles ni SKU o precio", () => {
    expect(planStockUpdates(products, { S: null, M: null })).toEqual([]);
    expect(planStockUpdates(products, { S: 7, M: 0 })).toEqual([
      { productId: "100", variantId: "1", size: "S", expectedStock: 0, stock: 7 },
      { productId: "100", variantId: "2", size: "M", expectedStock: 4, stock: 0 },
      { productId: "100", variantId: "3", size: "S", expectedStock: 0, stock: 7 },
    ]);
    expect(products[0]?.variants[0]?.stock).toBe(0);
  });
});
