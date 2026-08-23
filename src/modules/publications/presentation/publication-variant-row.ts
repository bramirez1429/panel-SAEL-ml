import type {
  PublicationAttribute,
  PublicationDetail,
  PublicationVariant,
} from "../domain/publication.model";

export type PublicationVariantTableRow = Readonly<{
  key: string;
  imageUrl: string | null;
  publicationId: string;
  userProductId: string | null;
  sku: string | null;
  itemId: string | null;
  familyId: string | null;
  variationId: number | null;
  status: string | null;
  price: PublicationVariant["price"];
  stock: number | null;
  sold: number | null;
  color: string | null;
  size: string | null;
  permalink: string | null;
}>;

export type PublicationVariationTableRow = Readonly<{
  key: string;
  userProductId: string;
  representative: PublicationVariantTableRow;
  offers: readonly PublicationVariantTableRow[];
}>;

/** Convierte el dominio a filas planas y deja los targets de edición explícitos. */
export function createPublicationVariantRows(
  publication: PublicationDetail,
): readonly PublicationVariantTableRow[] {
  if (publication.variants.length > 0) {
    return publication.variants.map((variant) =>
      mapVariantRow(variant, publication),
    );
  }

  return [
    {
      key: publication.id,
      imageUrl: publication.thumbnailUrl,
      publicationId: publication.id,
      userProductId: publication.group.userProductId,
      sku: getAttributeValue(publication.attributes, "SELLER_SKU"),
      itemId: publication.id,
      familyId: null,
      variationId: null,
      status: publication.status,
      price: toVariantPrice(publication),
      stock: publication.stock,
      sold: publication.sold,
      color: getAttributeValue(publication.attributes, "COLOR"),
      size: getAttributeValue(publication.attributes, "SIZE"),
      permalink: publication.permalink,
    },
  ];
}

/** Agrupa ofertas MLA sin perder sus precios ni identificadores individuales. */
export function groupFamilyRows(
  rows: readonly PublicationVariantTableRow[],
): readonly PublicationVariationTableRow[] {
  const groups = new Map<string, PublicationVariantTableRow[]>();
  for (const row of rows) {
    const key = row.userProductId ?? row.publicationId;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .map(([userProductId, offers]) => ({
      key: userProductId,
      userProductId,
      representative: offers[0]!,
      offers: [...offers].sort(compareRows),
    }))
    .sort((left, right) => compareRows(left.representative, right.representative));
}

export function compareRows(
  left: PublicationVariantTableRow,
  right: PublicationVariantTableRow,
): number {
  const color = (left.color ?? "").localeCompare(right.color ?? "", "es", { sensitivity: "base" });
  if (color !== 0) return color;
  return compareSizes(left.size, right.size);
}

export function compareSizes(left: string | null, right: string | null): number {
  const numericLeft = left !== null && /^\d+(?:[.,]\d+)?$/.test(left.trim()) ? Number(left.replace(",", ".")) : null;
  const numericRight = right !== null && /^\d+(?:[.,]\d+)?$/.test(right.trim()) ? Number(right.replace(",", ".")) : null;
  if (numericLeft !== null && numericRight !== null) return numericLeft - numericRight;
  const order = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const leftIndex = order.indexOf(left?.trim().toUpperCase() ?? "");
  const rightIndex = order.indexOf(right?.trim().toUpperCase() ?? "");
  if (leftIndex >= 0 && rightIndex >= 0) return leftIndex - rightIndex;
  if (leftIndex >= 0) return -1;
  if (rightIndex >= 0) return 1;
  return (left ?? "").localeCompare(right ?? "", "es", { numeric: true, sensitivity: "base" });
}

function toVariantPrice(
  publication: PublicationDetail,
): PublicationVariantTableRow["price"] {
  const from = publication.price?.from ?? null;
  const to = publication.price?.to ?? null;
  const amount = from ?? to;
  return amount === null
    ? null
    : { amount, currency: publication.price?.currency ?? null };
}

function mapVariantRow(
  variant: PublicationVariant,
  publication: PublicationDetail,
): PublicationVariantTableRow {
  const isFamily = publication.group.type === "USER_PRODUCT";
  return {
    key: variant.id,
    imageUrl: variant.thumbnailUrl,
    publicationId: variant.itemId ?? publication.id,
    userProductId: variant.userProductId,
    sku: variant.sku,
    itemId: variant.itemId ?? publication.id,
    familyId: isFamily ? publication.group.familyId : null,
    variationId: isFamily ? null : toVariationId(variant.id),
    status: variant.status,
    price: variant.price,
    stock: variant.stock,
    sold: variant.sold,
    color: getAttributeValue(variant.attributes, "COLOR"),
    size: getAttributeValue(variant.attributes, "SIZE"),
    permalink: variant.permalink,
  };
}

function toVariationId(value: string): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function getAttributeValue(
  attributes: readonly PublicationAttribute[],
  attributeId: "COLOR" | "SIZE" | "SELLER_SKU",
): string | null {
  const attribute = attributes.find(
    (item) => item.id.trim().toUpperCase() === attributeId,
  );
  return attribute?.value?.trim() || null;
}
