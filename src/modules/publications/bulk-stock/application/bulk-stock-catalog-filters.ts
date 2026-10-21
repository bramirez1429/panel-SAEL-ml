import type { BulkStockVariant } from "../domain/bulk-stock.model";

export const ALL_BULK_STOCK_FILTERS = "__ALL__";

export function normalizeBulkStockFilter(value: string): string {
  return value.normalize("NFD").replace(/\p{M}+/gu, "").trim().toUpperCase();
}

export function distinctBulkStockFilterOptions(
  values: readonly string[],
): Array<{ label: string; value: string }> {
  const options = new Map<string, string>();
  for (const label of values) {
    const key = normalizeBulkStockFilter(label);
    if (key && !options.has(key)) options.set(key, label);
  }
  return [...options].map(([value, label]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label, "es", { numeric: true }));
}

export function filterBulkStockCatalog(
  variants: readonly BulkStockVariant[],
  color: string,
  size: string,
): BulkStockVariant[] {
  return variants.filter(
    (variant) =>
      (color === ALL_BULK_STOCK_FILTERS ||
        normalizeBulkStockFilter(variant.color ?? "Sin color") === color) &&
      (size === ALL_BULK_STOCK_FILTERS ||
        normalizeBulkStockFilter(variant.size) === size),
  );
}
