import { describe, expect, it } from "vitest";
import type { TiendanubeProduct } from "@/modules/tiendanube/domain/tiendanube-products.model";
import { colorSizeKey, planStockUpdates, visibleColorSizes } from "./stock-by-size";

const products: TiendanubeProduct[] = [
  {
    id: "100", name: "Buzo de mujer", status: "visible", imageUrl: null, tags: [],
    variants: [
      { id: "1", size: "42", color: "Crema", sku: "B1", stock: 0, price: 200, promotionalPrice: null },
      { id: "2", size: "42", color: "Negro", sku: "B2", stock: 4, price: 200, promotionalPrice: null },
      { id: "3", size: "42", color: "Beige", sku: "B3", stock: 0, price: 200, promotionalPrice: null },
      { id: "4", size: "XL", color: "Crema", sku: "B4", stock: 4, price: 200, promotionalPrice: null, visible: false },
    ],
  },
  {
    id: "101", name: "Buzo de mujer 2", status: "visible", imageUrl: null, tags: [],
    variants: [
      { id: "5", size: "42", color: "Crema", sku: "B5", stock: 0, price: 300, promotionalPrice: null },
      { id: "6", size: "44", color: "Negro", sku: "B6", stock: 8, price: 300, promotionalPrice: null },
    ],
  },
  {
    id: "102", name: "Buzo oculto", status: "hidden", imageUrl: null, tags: [],
    variants: [
      { id: "9", size: "2XL", color: "Negro", sku: "B9", stock: 0, price: 200, promotionalPrice: null },
    ],
  },
  {
    id: "103", name: "Buzo sin listar", status: "unlisted", imageUrl: null, tags: [],
    variants: [
      { id: "10", size: "L", color: "Marrón", sku: "B10", stock: 0, price: 200, promotionalPrice: null },
    ],
  },
];

describe("stock global por color y talle", () => {
  it("muestra Crema, Negro y Beige separados, con cada talle una sola vez por color", () => {
    expect(visibleColorSizes(products)).toEqual([
      { key: "BEIGE", color: "Beige", sizes: [
        { key: colorSizeKey("Beige", "42"), size: "42", variants: 1 },
      ] },
      { key: "CREMA", color: "Crema", sizes: [
        { key: colorSizeKey("Crema", "42"), size: "42", variants: 2 },
      ] },
      { key: "NEGRO", color: "Negro", sizes: [
        { key: colorSizeKey("Negro", "42"), size: "42", variants: 1 },
        { key: colorSizeKey("Negro", "44"), size: "44", variants: 1 },
      ] },
    ]);
    expect(colorSizeKey("CREMA", "42")).toBe(colorSizeKey("crema", "42"));
    expect(colorSizeKey("Crema", "42")).not.toBe(colorSizeKey("Beige", "42"));
  });

  it("modifica solo Crema/42 y no afecta Negro/42 ni Beige/42", () => {
    const input = { [colorSizeKey("Crema", "42")]: 7 };
    expect(planStockUpdates(products, input)).toEqual([
      { productId: "100", variantId: "1", size: "42", color: "Crema", expectedStock: 0, stock: 7 },
      { productId: "101", variantId: "5", size: "42", color: "Crema", expectedStock: 0, stock: 7 },
    ]);
    expect(products[0]?.variants[0]?.stock).toBe(0);
  });

  it("permite stock cero y deja intactos inputs vacíos y variantes ocultas", () => {
    const input = {
      [colorSizeKey("Crema", "42")]: null,
      [colorSizeKey("Negro", "42")]: 0,
      [colorSizeKey("Beige", "42")]: null,
    };
    expect(planStockUpdates(products, input)).toEqual([
      { productId: "100", variantId: "2", size: "42", color: "Negro", expectedStock: 4, stock: 0 },
    ]);
  });
});
