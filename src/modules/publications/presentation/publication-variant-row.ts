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
