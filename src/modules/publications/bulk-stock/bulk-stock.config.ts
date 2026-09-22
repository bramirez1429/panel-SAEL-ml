import type { BulkStockProductType } from "./domain/bulk-stock.model";

export type BulkStockSizeOption = Readonly<{
  label: string;
  value: string;
}>;

const womenSizeOptions: readonly BulkStockSizeOption[] = [
  { label: "S (38)", value: "38" },
  { label: "M (40)", value: "40" },
  { label: "L (42)", value: "42" },
  { label: "XL (44)", value: "44" },
  { label: "2XL (46)", value: "46" },
];

const girlsSizeOptions: readonly BulkStockSizeOption[] = [
  { label: "6", value: "6" },
  { label: "8", value: "8" },
  { label: "10", value: "10" },
  { label: "12", value: "12" },
  { label: "14", value: "14" },
];

const girlsSweatshirtSizeOptions: readonly BulkStockSizeOption[] = [
  { label: "4", value: "4" },
  ...girlsSizeOptions,
  { label: "16", value: "16" },
];

export const BULK_STOCK_SIZE_OPTIONS_BY_TYPE: Readonly<
  Record<BulkStockProductType, readonly BulkStockSizeOption[]>
> = {
  BUZO_MUJER: womenSizeOptions,
  REMERA_MUJER: womenSizeOptions,
  BUZO_NENA: girlsSweatshirtSizeOptions,
  REMERA_NENA: girlsSizeOptions,
};
