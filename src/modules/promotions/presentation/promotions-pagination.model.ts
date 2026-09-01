export const PROMOTIONS_PAGE_SIZE = 20;

export function parsePromotionsPage(value: string | null): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function knownPromotionsPages(
  currentPage: number,
  done: boolean,
  nextCursor: string | null,
): number {
  return !done && nextCursor ? currentPage + 1 : currentPage;
}
