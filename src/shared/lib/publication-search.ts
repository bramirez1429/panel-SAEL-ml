export type PublicationSearchCriteria = Readonly<{
  type: "FAMILY" | "MLA" | "MLAU" | "TITLE";
  value: string;
}>;

const LEGACY_MLA_NUMBER_PATTERN = /^\d{1,11}$/;
const FAMILY_PATTERN = /^\d{12,}$/;
const MLA_PATTERN = /^MLA\d+$/i;
const MLAU_PATTERN = /^MLAU\d+$/i;

export function parsePublicationSearch(term: string): PublicationSearchCriteria | null {
  const value = term.trim().replace(/\s+/g, " ");
  if (!value) return null;
  if (MLAU_PATTERN.test(value)) return { type: "MLAU", value: value.toUpperCase() };
  if (MLA_PATTERN.test(value)) return { type: "MLA", value: value.toUpperCase() };
  if (LEGACY_MLA_NUMBER_PATTERN.test(value)) return { type: "MLA", value: `MLA${value}` };
  if (FAMILY_PATTERN.test(value)) return { type: "FAMILY", value };
  return { type: "TITLE", value };
}
