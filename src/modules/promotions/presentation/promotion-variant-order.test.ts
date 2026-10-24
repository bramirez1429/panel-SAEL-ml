import { describe, expect, it } from "vitest";
import type { PromotionRow } from "../domain/promotion.model";
import type { SelectedPromotion } from "./promotion-global.store";
import { groupPromotionPublications, sortPromotionPublications, sortPromotionSelections } from "./promotion-variant-order";

function row(id: string, title: string, extra: Partial<PromotionRow> = {}): PromotionRow {
  return { itemId: id, title, familyId: "F1", sku: null, thumbnail: null, stock: 1,
    freeShipping: false, installmentLabel: null, price: 30000, currentPromotion: null,
    hasActivePromotion: false, productGroup: "WOMEN_TSHIRT", ...extra };
}

describe("promotion variant ordering", () => {
  it("reúne cada color o pack y mantiene el orden de talles dentro del grupo", () => {
    const source = [
      row("a", "Remera Pack 2 XXL"),
      row("b", "Remera Pack 1 L"),
      row("c", "Remera Pack 1 S"),
      row("d", "Remera Pack 2 M"),
      row("e", "Remera Negro XL", { variantColor: "Negro" }),
      row("f", "Remera Negro S", { variantColor: "Negro" }),
    ];
    const groups = groupPromotionPublications(source);
    expect(groups.map((group) => group.label)).toEqual(["Negro", "Pack 1", "Pack 2"]);
    expect(groups.map((group) => group.publications.map((item) => item.itemId))).toEqual([
      ["f", "e"], ["c", "b"], ["d", "a"],
    ]);
    expect(source[0]?.itemId).toBe("a");
  });

  it("separa packs con igual número pero distintas combinaciones de color", () => {
    const groups = groupPromotionPublications([
      row("a", "Pack 3 blanco-negro S", { variantColor: "Pack 3 blanco-negro" }),
      row("b", "Pack 3 rojo-blanco M", { variantColor: "Pack 3 rojo-blanco" }),
    ]);
    expect(groups.map((group) => group.label)).toEqual(["Pack 3 Blanco Negro", "Pack 3 Rojo Blanco"]);
  });

  it("agrupa Pack x4 por combinación de color y ordena todos sus talles", () => {
    const groups = groupPromotionPublications([
      row("a", "Remera Pack x4 XL", { variantColor: "Blanco Negro" }),
      row("b", "Remera Pack x4 S", { variantColor: "Blanco Negro" }),
      row("c", "Remera Pack x4 M", { variantColor: "Lila Blanco" }),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.label)).toEqual(["Pack 4 Blanco Negro", "Pack 4 Lila Blanco"]);
    expect(groups[0]?.publications.map((item) => item.itemId)).toEqual(["b", "a"]);
  });

  it("no agrupa productos sin color ni pack conocidos", () => {
    const groups = groupPromotionPublications([
      row("a", "Remera Simple"),
      row("b", "Remera Simple"),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.every((group) => group.label === null)).toBe(true);
  });

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
