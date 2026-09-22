import { getPublicationFormatLabel } from "./bulk-stock-format";
import type { BulkStockVariant } from "../domain/bulk-stock.model";

export function normalizeSearchText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase("es")
    .trim()
    .replace(/\s+/g, " ");
}

export function matchesBulkStockSearch(variant: BulkStockVariant, query: string): boolean {
  const terms = normalizeSearchText(query).split(" ").filter(Boolean);
  if (terms.length === 0) return true;

  const searchableText = normalizeSearchText([
    variant.title,
    variant.color,
    variant.size,
    variant.itemId,
    variant.variationId,
    variant.userProductId,
    variant.familyId,
    variant.key,
    variant.model,
    getPublicationFormatLabel(variant.model),
  ].filter(Boolean).join(" "));

  return terms.every((term) => searchableText.includes(term));
}
