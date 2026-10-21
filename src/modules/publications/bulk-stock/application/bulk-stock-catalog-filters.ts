import type { BulkStockVariant } from "../domain/bulk-stock.model";

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

/** Varias opciones dentro de cada filtro se combinan con OR; color y talle con AND.
 * Una selección vacía equivale a "Todos", sin perder variantes. */
export function filterBulkStockCatalog(
  variants: readonly BulkStockVariant[],
  colors: readonly string[],
  sizes: readonly string[],
): BulkStockVariant[] {
  const selectedColors = new Set(colors.map(normalizeBulkStockFilter));
  const selectedSizes = new Set(sizes.map(normalizeBulkStockFilter));

  return variants.filter((variant) =>
    (selectedColors.size === 0 ||
      selectedColors.has(normalizeBulkStockFilter(variant.color ?? "Sin color"))) &&
    (selectedSizes.size === 0 ||
      selectedSizes.has(normalizeBulkStockFilter(variant.size))),
  );
}
