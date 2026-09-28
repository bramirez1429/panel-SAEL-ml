export type PublicationSearchCriteria = Readonly<{
  type: "FAMILY" | "MLA" | "MLAU" | "TITLE";
  value: string;
}>;

const FAMILY_PATTERN = /^\d+$/;
const MLA_PATTERN = /^MLA\d+$/i;
const MLAU_PATTERN = /^MLAU\d+$/i;

export function parsePublicationSearch(term: string): PublicationSearchCriteria | null {
  const value = term.trim().replace(/\s+/g, " ");
  if (!value) return null;
  if (FAMILY_PATTERN.test(value)) return { type: "FAMILY", value };
  if (MLAU_PATTERN.test(value)) return { type: "MLAU", value: value.toUpperCase() };
  if (MLA_PATTERN.test(value)) return { type: "MLA", value: value.toUpperCase() };
  return { type: "TITLE", value };
}
