import type { PublicationType } from "../domain/publication.model";
import {
  PUBLICATION_QUICK_FILTERS,
  type PublicationQuickFilter,
} from "../application/publication-quick-filter";

export const PUBLICATIONS_PAGE_SIZE = 20;

export type PublicationSearchParamsInput = Readonly<
  Record<string, string | readonly string[] | undefined>
>;

export type PublicationsUrlState = Readonly<{
  page: number;
  cursor: string | null;
  search: string;
  type: PublicationType | null;
  status: string;
  quickFilters: readonly PublicationQuickFilter[];
}>;

const publicationTypes: readonly PublicationType[] = [
  "LEGACY",
  "USER_PRODUCT",
];

/** Normaliza la URL pública antes de entregarla al caso de uso. */
export function parsePublicationsSearchParams(
  searchParams: PublicationSearchParamsInput,
): PublicationsUrlState {
  const pageValue = getFirstValue(searchParams.page);
  const parsedPage = Number(pageValue);
  const typeValue = getFirstValue(searchParams.type);
  const cursor = getFirstValue(searchParams.cursor).trim();
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return {
    page: cursor ? page : 1,
    cursor: cursor || null,
    search: normalizePublicationSearch(getFirstValue(searchParams.search)),
    type: isPublicationType(typeValue) ? typeValue : null,
    status: getFirstValue(searchParams.status).trim(),
    quickFilters: parseQuickFilters(getFirstValue(searchParams.quick)),
  };
}

export function normalizePublicationSearch(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function buildPublicationsUrl(
  current: PublicationsUrlState,
  patch: Partial<PublicationsUrlState> = {},
): string {
  const next = { ...current, ...patch };
  const searchParams = new URLSearchParams({
    page: String(next.page),
    cursor: next.cursor ?? "",
    search: next.search,
    type: next.type ?? "",
    status: next.status,
  });
  if (next.quickFilters.length > 0) {
    searchParams.set("quick", next.quickFilters.join(","));
  }

  return `/publicaciones?${searchParams.toString()}`;
}

function getFirstValue(
  value: string | readonly string[] | undefined,
): string {
  return typeof value === "string" ? value : (value?.[0] ?? "");
}

function isPublicationType(value: string): value is PublicationType {
  return publicationTypes.some((type) => type === value);
}

function parseQuickFilters(value: string): readonly PublicationQuickFilter[] {
  const values = new Set(value.split(","));
  return PUBLICATION_QUICK_FILTERS.filter((filter) => values.has(filter));
}
