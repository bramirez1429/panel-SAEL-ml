const PUBLICATION_SIZE_PATTERN = /(^|\s)(4XL|3XL|2XL|XXXL|XXL|XL|XS|S|M|L|14|12|10|8|6)(?=\s|$)/iu;

const PUBLICATION_SIZE_ORDER = new Map<string, number>([
  ["XS", 0],
  ["S", 10],
  ["M", 20],
  ["L", 30],
  ["XL", 40],
  ["2XL", 50],
  ["XXL", 50],
  ["3XL", 60],
  ["XXXL", 60],
  ["4XL", 70],
  ["6", 10],
  ["8", 20],
  ["10", 30],
  ["12", 40],
  ["14", 50],
]);

export function publicationTitlePresentation(title: string): Readonly<{
  title: string;
  size: string | null;
}> {
  const match = PUBLICATION_SIZE_PATTERN.exec(title);
  const matchedSize = match?.[2];
  if (!match || !matchedSize) return { title, size: null };

  const sizeStart = match.index + (match[1]?.length ?? 0);
  const titleWithoutSize = (
    title.slice(0, sizeStart) + title.slice(sizeStart + matchedSize.length)
  ).replace(/\s{2,}/gu, " ").trim();

  return {
    title: titleWithoutSize || title,
    size: matchedSize.toUpperCase(),
  };
}

export function comparePublicationTitlesBySize(
  leftTitle: string,
  rightTitle: string,
): number {
  return sizeOrder(publicationTitlePresentation(leftTitle).size)
    - sizeOrder(publicationTitlePresentation(rightTitle).size);
}

function sizeOrder(size: string | null): number {
  return size
    ? PUBLICATION_SIZE_ORDER.get(size) ?? Number.MAX_SAFE_INTEGER
    : Number.MAX_SAFE_INTEGER;
}
