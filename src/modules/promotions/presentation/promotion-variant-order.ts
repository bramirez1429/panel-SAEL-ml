import type { SelectedPromotion } from "./promotion-global.store";

const collator = new Intl.Collator("es-AR", { sensitivity: "base", numeric: true });
const groups: Readonly<Record<string, number>> = {
  WOMEN_TSHIRT: 0, WOMEN_SWEATSHIRT: 1, GIRLS_TSHIRT: 2, GIRLS_SWEATSHIRT: 3,
};
const sizeRanks: Readonly<Record<string, number>> = {
  XS: 0, S: 10, "38": 10, M: 20, "40": 20, L: 30, "42": 30,
  XL: 40, "44": 40, XXL: 50, "2XL": 50, "46": 50,
  "3XL": 60, XXXL: 60, "4XL": 70,
  "6": 10, "8": 20, "10": 30, "12": 40, "14": 50,
};
const sizePattern = /(?:^|[^A-Z0-9])(4XL|3XL|XXXL|XXL|2XL|XL|XS|S|M|L|46|44|42|40|38|14|12|10|8|6)(?=$|[^A-Z0-9])/u;
const packPattern = /(?:^|[^A-Z0-9])PACK\s*(?:X\s*|N\s*[O°º.]?\s*)?(\d+)(?=$|[^A-Z0-9])/u;
const colorNames: Readonly<Record<string, string>> = {
  NEGRO: "NEGRO", NEGRA: "NEGRO", BLACK: "NEGRO", PRETO: "NEGRO",
  BLANCO: "BLANCO", BLANCA: "BLANCO", WHITE: "BLANCO",
  ROSA: "ROSA", ROSADO: "ROSA", PINK: "ROSA",
  ROJO: "ROJO", ROJA: "ROJO", RED: "ROJO",
  LILA: "LILA", LAVANDA: "LAVANDA", VIOLETA: "VIOLETA", PURPURA: "VIOLETA",
  GRIS: "GRIS", MELANGE: "MELANGE", GREY: "GRIS", GRAY: "GRIS",
  AZUL: "AZUL", BLUE: "AZUL", CELESTE: "CELESTE", VERDE: "VERDE", GREEN: "VERDE",
  BEIGE: "BEIGE", CREMA: "CREMA", MARFIL: "MARFIL",
  MARRON: "MARRON", BROWN: "MARRON", CHOCOLATE: "CHOCOLATE",
  AMARILLO: "AMARILLO", YELLOW: "AMARILLO", NARANJA: "NARANJA",
};
const colorPattern = new RegExp(
  "(?:^|[^A-Z0-9])(" + Object.keys(colorNames).join("|") + ")(?=$|[^A-Z0-9])", "u",
);

type VariantRow = Readonly<{
  itemId: string;
  title: string;
  familyId?: string | null;
  productGroup?: string | null;
  sku?: string | null;
  variantColor?: string | null;
  variantSize?: string | null;
}>;

export function sortPromotionPublications<T extends VariantRow>(items: readonly T[]): T[] {
  return items.map((item, index) => ({ item, index, keys: variantKeys(item) }))
    .sort((a, b) => {
      const group = a.keys.group - b.keys.group;
      if (group !== 0) return group;
      const product = collator.compare(a.keys.product, b.keys.product);
      if (product !== 0) return product;
      const colorMissing = Number(a.keys.color === null) - Number(b.keys.color === null);
      if (colorMissing !== 0) return colorMissing;
      const color = collator.compare(a.keys.color ?? "", b.keys.color ?? "");
      if (color !== 0) return color;
      const rank = a.keys.sizeRank - b.keys.sizeRank;
      if (rank !== 0) return rank;
      const label = collator.compare(a.keys.size ?? "", b.keys.size ?? "");
      return label !== 0 ? label : a.index - b.index;
    }).map(({ item }) => item);
}

export type PromotionVariantGroup<T> = Readonly<{
  key: string;
  label: string | null;
  publications: readonly T[];
}>;

/**
 * Create collapsible groups within each product family, by color or pack.
 * Listings without a verifiable color stay separate rather than being
 * mistakenly grouped as the same anonymous variant.
 */
export function groupPromotionPublications<T extends VariantRow>(
  publications: readonly T[],
): PromotionVariantGroup<T>[] {
  const groups: Array<{ key: string; label: string | null; publications: T[] }> = [];
  const groupByKey = new Map<string, (typeof groups)[number]>();

  for (const publication of sortPromotionPublications(publications)) {
    const keys = variantKeys(publication);
    const key = JSON.stringify([keys.group, keys.product, keys.color ?? ("ITEM:" + publication.itemId)]);
    let group = groupByKey.get(key);
    if (!group) {
      group = {
        key,
        label: keys.color ? formatVariantGroupLabel(keys.color) : null,
        publications: [],
      };
      groupByKey.set(key, group);
      groups.push(group);
    }
    group.publications.push(publication);
  }
  return groups;
}

function formatVariantGroupLabel(color: string): string {
  if (color.startsWith("PACK ")) return "Pack " + color.slice(5).toLocaleLowerCase("es-AR").replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("es-AR"));
  return color.toLocaleLowerCase("es-AR")
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("es-AR"));
}

export function sortPromotionSelections(selections: readonly SelectedPromotion[]): SelectedPromotion[] {
  return sortPromotionPublications(selections.map((selection) => ({
    ...selection,
    title: selection.publicationTitle,
  })));
}

function variantKeys(row: VariantRow): Readonly<{
  group: number; product: string; color: string | null; size: string | null; sizeRank: number;
}> {
  const normalizedTitle = normalize(row.title);
  const normalizedSku = normalize(row.sku ?? "");
  // A pack can list its color combination in the title or variant attributes.
  // Keep all colors together so identically numbered packs do not merge.
  const titlePack = detectPack([normalizedTitle, normalize(row.variantColor ?? "")].join(" "));
  const color = titlePack ?? colorKey(row.variantColor) ?? detectedColor(normalizedTitle) ?? detectedColor(normalizedSku);
  const size = detectedSize(normalize(row.variantSize ?? ""))
    ?? detectedSize(normalizedTitle) ?? detectedSize(normalizedSku);
  const baseTitle = productTitle(normalizedTitle);
  return {
    group: row.productGroup ? (groups[row.productGroup] ?? 99) : 99,
    product: row.familyId ? "FAMILY:" + row.familyId : "TITLE:" + baseTitle,
    color,
    size,
    sizeRank: size ? sizeRanks[size] ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER,
  };
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/\p{M}+/gu, "").toUpperCase()
    .replace(/[_-]+/gu, " ").replace(/\s+/gu, " ").trim();
}

function colorKey(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const normalized = normalize(value);
  const pack = detectPack(normalized);
  if (pack) return pack;
  const color = colorPattern.exec(normalized)?.[1];
  return color ? colorNames[color] ?? color : normalized;
}

function detectedColor(normalized: string): string | null {
  const pack = detectPack(normalized);
  if (pack) return pack;
  const word = colorPattern.exec(normalized)?.[1];
  return word ? colorNames[word] ?? word : null;
}

function detectedSize(normalized: string): string | null {
  const found = sizePattern.exec(normalized)?.[1];
  return found === "2XL" ? "XXL" : found ?? null;
}

function productTitle(normalized: string): string {
  const noPacks = normalized.replace(/(?:^|\s)PACK\s*(?:N\s*[O°º.]?\s*)?\d+(?=\s|$)/gu, " ");
  const noColors = noPacks.replace(new RegExp("(?:^|\\s)(?:" + Object.keys(colorNames).join("|") + ")(?=\\s|$)", "gu"), " ");
  const noSizes = noColors.replace(/(?:^|\s)(?:4XL|3XL|XXXL|XXL|2XL|XL|XS|S|M|L|46|44|42|40|38|14|12|10|8|6)(?=\s|$)/gu, " ");
  return noSizes.replace(/\b(?:TALLE|TALLA|SIZE|COLOR)\b/gu, " ").replace(/\s+/gu, " ").trim() || normalized;
}

/** Avoid merging Pack 3 blanco-negro and Pack 3 rojo-blanco. */
function detectPack(value: string): string | null {
  const pack = packPattern.exec(value);
  if (!pack?.[1]) return null;
  const suffix = value.slice(pack.index + pack[0].length);
  const allColors = new RegExp(colorPattern.source, "gu");
  const colors = [...suffix.matchAll(allColors)]
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => colorNames[value] ?? value);
  return ["PACK", String(Number(pack[1])), ...colors].join(" ");
}
