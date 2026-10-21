import { describe, expect, it } from "vitest";
import type { BulkStockVariant } from "../domain/bulk-stock.model";
import {
  distinctBulkStockFilterOptions,
  filterBulkStockCatalog,
  normalizeBulkStockFilter,
} from "./bulk-stock-catalog-filters";

const variants = [
  { key: "MLA1:1", color: "Negro", size: "40" },
  { key: "MLA1:2", color: "Negro", size: "44" },
  { key: "MLAU3", color: "Crema", size: "40" },
  { key: "MLA5", color: "Blanco", size: "42" },
  { key: "MLA4", color: null, size: "Único" },
] as BulkStockVariant[];

const ids = (colorFilters: string[], sizeFilters: string[]) =>
  filterBulkStockCatalog(variants, colorFilters, sizeFilters).map(({ key }) => key);

describe("filtros múltiples por color y talle para stock masivo", () => {
  it("sin seleccionar etiquetas, devuelve todas las variantes", () => {
    expect(ids([], [])).toEqual(["MLA1:1", "MLA1:2", "MLAU3", "MLA5", "MLA4"]);
  });

  it("varios colores se combinan con OR, sin excluir tamaños", () => {
    expect(ids(["NEGRO", "CREMA"], [])).toEqual(["MLA1:1", "MLA1:2", "MLAU3"]);
  });

  it("varios talles se combinan con OR, sin excluir colores", () => {
    expect(ids([], ["40", "42"])).toEqual(["MLA1:1", "MLAU3", "MLA5"]);
  });

  it("varios colores y varios talles se cruzan con AND", () => {
    expect(ids(["Negro", "Crema"], ["40", "44"])).toEqual([
      "MLA1:1", "MLA1:2", "MLAU3",
    ]);
    expect(ids(["Negro", "Blanco"], ["40", "42"])).toEqual(["MLA1:1", "MLA5"]);
  });

  it("admite color sin información, normaliza tildes y evita coincidencias falsas", () => {
    expect(ids(["sin color"], ["único"])).toEqual(["MLA4"]);
    expect(ids(["Rojo"], [])).toEqual([]);
    expect(normalizeBulkStockFilter("único")).toBe("UNICO");
  });

  it("ofrece exclusivamente colores reales sin repetir variantes de escritura", () => {
    expect(distinctBulkStockFilterOptions(["Negro", "NEGRO", "Crema"])).toEqual([
      { label: "Crema", value: "CREMA" },
      { label: "Negro", value: "NEGRO" },
    ]);
  });
});
