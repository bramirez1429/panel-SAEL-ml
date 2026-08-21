import type { PublicationType } from "../domain/publication.model";

export const PUBLICATIONS_PAGE_SIZE = 20;

export type PublicationSearchParamsInput = Readonly<
  Record<string, string | readonly string[] | undefined>
>;

export type PublicationsUrlState = Readonly<{
  page: number;
  search: string;
  type: PublicationType | null;
  status: string;
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

  return {
    page:
      Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    search: getFirstValue(searchParams.search).trim(),
    type: isPublicationType(typeValue) ? typeValue : null,
    status: getFirstValue(searchParams.status).trim(),
  };
}

export function buildPublicationsUrl(
  current: PublicationsUrlState,
  patch: Partial<PublicationsUrlState> = {},
): string {
  const next = { ...current, ...patch };
  const searchParams = new URLSearchParams({
    page: String(next.page),
    search: next.search,
    type: next.type ?? "",
    status: next.status,
  });

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
