import type { Publication } from "../domain/publication.model";

export const PUBLICATION_QUICK_FILTERS = [
  "WOMEN_TSHIRT",
  "WOMEN_SWEATSHIRT",
  "GIRLS_TSHIRT",
  "GIRLS_SWEATSHIRT",
  "BOYS_TSHIRT",
  "BOYS_SWEATSHIRT",
] as const;

export type PublicationQuickFilter = (typeof PUBLICATION_QUICK_FILTERS)[number];

const filterTerms: Readonly<Record<PublicationQuickFilter, Readonly<{
  product: readonly string[];
  audience: readonly string[];
}>>> = {
  WOMEN_TSHIRT: { product: ["remera"], audience: ["mujer", "dama"] },
  WOMEN_SWEATSHIRT: { product: ["buzo", "hoodie"], audience: ["mujer", "dama"] },
  GIRLS_TSHIRT: { product: ["remera"], audience: ["nina", "nena"] },
  GIRLS_SWEATSHIRT: { product: ["buzo", "hoodie"], audience: ["nina", "nena"] },
  BOYS_TSHIRT: { product: ["remera"], audience: ["nino", "nene"] },
  BOYS_SWEATSHIRT: { product: ["buzo", "hoodie"], audience: ["nino", "nene"] },
};

export function matchesPublicationQuickFilters(
  publication: Publication,
  selectedFilters: readonly PublicationQuickFilter[],
): boolean {
  if (selectedFilters.length === 0) return true;

  const searchableName = normalize([
    publication.title,
    ...(publication.variants?.map((variant) => variant.title ?? "") ?? []),
  ].join(" "));

  return selectedFilters.some((filter) => {
    const terms = filterTerms[filter];
    return terms.product.some((term) => searchableName.includes(term))
      && terms.audience.some((term) => searchableName.includes(term));
  });
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}
