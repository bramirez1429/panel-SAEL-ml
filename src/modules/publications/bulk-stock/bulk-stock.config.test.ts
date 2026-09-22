import { describe, expect, it } from "vitest";

import {
  BULK_STOCK_PRODUCT_TYPE_OPTIONS,
  BULK_STOCK_SIZE_OPTIONS_BY_TYPE,
  getBulkStockProductTypeLabel,
} from "./bulk-stock.config";

describe("bulk stock size options", () => {
  it("maps product types to user-facing labels without changing values", () => {
    expect(BULK_STOCK_PRODUCT_TYPE_OPTIONS).toEqual([
      { label: "Remera de mujer", value: "REMERA_MUJER" },
      { label: "Buzo de mujer", value: "BUZO_MUJER" },
      { label: "Remera de niña", value: "REMERA_NENA" },
      { label: "Buzo de niña", value: "BUZO_NENA" },
    ]);
    expect(getBulkStockProductTypeLabel("REMERA_MUJER")).toBe("Remera de mujer");
    expect(getBulkStockProductTypeLabel("BUZO_MUJER")).toBe("Buzo de mujer");
    expect(getBulkStockProductTypeLabel("REMERA_NENA")).toBe("Remera de niña");
    expect(getBulkStockProductTypeLabel("BUZO_NENA")).toBe("Buzo de niña");
  });

  it("uses the adult labels and values required by the backend", () => {
    expect(BULK_STOCK_SIZE_OPTIONS_BY_TYPE.BUZO_MUJER).toEqual([
      { label: "S (38)", value: "38" },
      { label: "M (40)", value: "40" },
      { label: "L (42)", value: "42" },
      { label: "XL (44)", value: "44" },
      { label: "2XL (46)", value: "46" },
    ]);
    expect(BULK_STOCK_SIZE_OPTIONS_BY_TYPE.REMERA_MUJER)
      .toEqual(BULK_STOCK_SIZE_OPTIONS_BY_TYPE.BUZO_MUJER);
  });

  it("uses only the allowed children sizes", () => {
    expect(BULK_STOCK_SIZE_OPTIONS_BY_TYPE.REMERA_NENA).toEqual([
      { label: "6", value: "6" },
      { label: "8", value: "8" },
      { label: "10", value: "10" },
      { label: "12", value: "12" },
      { label: "14", value: "14" },
    ]);
    expect(BULK_STOCK_SIZE_OPTIONS_BY_TYPE.BUZO_NENA.map((option) => option.value))
      .toEqual(["4", "6", "8", "10", "12", "14", "16"]);
  });
});
