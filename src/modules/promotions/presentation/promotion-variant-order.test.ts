import { describe, expect, it } from "vitest";
import type { PromotionRow } from "../domain/promotion.model";
import type { SelectedPromotion } from "./promotion-global.store";
import { sortPromotionPublications, sortPromotionSelections } from "./promotion-variant-order";

function row(id: string, title: string, extra: Partial<PromotionRow> = {}): PromotionRow {
  return { itemId: id, title, familyId: "F1", sku: null, thumbnail: null, stock: 1,
    freeShipping: false, installmentLabel: null, price: 30000, currentPromotion: null,
    hasActivePromotion: false, productGroup: "WOMEN_TSHIRT", ...extra };
}

describe("promotion variant ordering", () => {
  it("agrupa colores y después ordena S, M, L, XL, XXL", () => {
    const input = [
      row("a", "Remera Rosa XL", { variantColor: "Rosa" }),
      row("b", "Remera Negro XXL", { variantColor: "Negro" }),
      row("c", "Remera Negro M", { variantColor: "Negro" }),
      row("d", "Remera Rosa S", { variantColor: "Rosa" }),
      row("e", "Remera Negro S", { variantColor: "Negro" }),
    ];
    expect(sortPromotionPublications(input).map((r) => r.itemId)).toEqual(["e", "c", "b", "d", "a"]);
    expect(input[0]?.itemId).toBe("a"); // input is not mutated
  });
  it("ordena los adultos numerados 38, 40, 42, 44, 46", () => {
    const source = ["46", "40", "44", "38", "42"].map((size) =>
      row(size, "Remera Negro Talle " + size, { variantColor: "Negro" }));
    expect(sortPromotionPublications(source).map((r) => r.itemId)).toEqual(["38", "40", "42", "44", "46"]);
  });
  it("ordena niños 6, 8, 10, 12, 14 en cada color", () => {
    const source = ["14", "8", "12", "6", "10"].map((size) =>
      row(size, "Remera Niña Lila " + size, { productGroup: "GIRLS_TSHIRT", variantColor: "Lila" }));
    expect(sortPromotionPublications(source).map((r) => r.itemId)).toEqual(["6", "8", "10", "12", "14"]);
  });
  it("separa Pack 1 y Pack 2 sin inventar colores, ordenando dentro de cada uno", () => {
    const source = [
      row("a", "Remera Pack 2 XL"), row("b", "Remera Pack 1 L"),
      row("c", "Remera Pack 2 S"), row("d", "Remera Pack 1 S"),
    ];
    expect(sortPromotionPublications(source).map((r) => r.itemId)).toEqual(["d", "b", "c", "a"]);
  });
  it("usa color/talle de atributos ML antes del título y agrupa por familia", () => {
    const source = [
      row("a", "Remera de mujer S", { variantColor: "Rosa", variantSize: "XL" }),
      row("b", "Remera de mujer XXL", { variantColor: "Negro", variantSize: "38" }),
      row("c", "Buzo de mujer S", { familyId: "OTHER", variantColor: "Rosa" }),
    ];
    const ids = sortPromotionPublications(source).map((r) => r.itemId);
    expect(ids.indexOf("b")).toBeLessThan(ids.indexOf("a"));
    expect(ids).toHaveLength(3);
  });
  it("mantiene la ordenación al convertir las promociones seleccionadas", () => {
    const options = { id: "P1", offerId: null, type: "DEAL" } as const;
    const selected = [
      { key: "m", itemId: "m", publicationTitle: "Remera Negro M", familyId: "F1", option: options },
      { key: "s", itemId: "s", publicationTitle: "Remera Negro S", familyId: "F1", option: options },
    ];
    expect(sortPromotionSelections(selected as unknown as readonly SelectedPromotion[]).map((s) => s.key)).toEqual(["s", "m"]);
  });
});
