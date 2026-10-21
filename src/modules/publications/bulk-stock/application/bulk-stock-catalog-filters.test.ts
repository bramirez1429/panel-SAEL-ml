import { describe, expect, it } from "vitest";
import type { BulkStockVariant } from "../domain/bulk-stock.model";
import {
  ALL_BULK_STOCK_FILTERS,
  distinctBulkStockFilterOptions,
  filterBulkStockCatalog,
  normalizeBulkStockFilter,
} from "./bulk-stock-catalog-filters";

const variants = [
  { key: "MLA1:1", color: "Negro", size: "40" },
  { key: "MLA1:2", color: "Negro", size: "44" },
  { key: "MLAU3", color: "Crema", size: "40" },
  { key: "MLA4", color: null, size: "Único" },
] as BulkStockVariant[];

describe("filtros por variante del catálogo de stock", () => {
  it("conserva todas las variantes si ambos filtros son Todos", () => {
    expect(filterBulkStockCatalog(variants, ALL_BULK_STOCK_FILTERS, ALL_BULK_STOCK_FILTERS))
      .toHaveLength(4);
  });

  it("cruza color y talle sin excluir formatos antiguos o nuevos", () => {
    expect(filterBulkStockCatalog(variants, normalizeBulkStockFilter("NEGRO"), normalizeBulkStockFilter("40"))
      .map(({ key }) => key)).toEqual(["MLA1:1"]);
    expect(filterBulkStockCatalog(variants, ALL_BULK_STOCK_FILTERS, normalizeBulkStockFilter("40"))
      .map(({ key }) => key)).toEqual(["MLA1:1", "MLAU3"]);
  });

  it("ofrece solo colores y talles reales, con coincidencias sin acentos", () => {
    expect(distinctBulkStockFilterOptions(["Negro", "NEGRO", "Crema"])).toEqual([
      { label: "Crema", value: "CREMA" },
      { label: "Negro", value: "NEGRO" },
    ]);
    expect(normalizeBulkStockFilter("único")).toBe("UNICO");
  });
});
