import type { PublicationSearchCriteria } from "./publication-search.model";

const FAMILY_PATTERN = /^\d+$/;
const MLA_PATTERN = /^MLA\d+$/i;

export function parsePublicationSearch(term: string): PublicationSearchCriteria | null {
  const value = term.trim();
  if (!value) return null;
  if (FAMILY_PATTERN.test(value)) return { type: "FAMILY", value };
  if (MLA_PATTERN.test(value)) return { type: "MLA", value: value.toUpperCase() };
  return { type: "TITLE", value };
}
