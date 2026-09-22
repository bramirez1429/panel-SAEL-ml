import { describe, expect, it } from "vitest";

import { BULK_STOCK_SIZE_OPTIONS_BY_TYPE } from "./bulk-stock.config";

describe("bulk stock size options", () => {
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
