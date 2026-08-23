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
  status: string | null;
  price: PublicationVariant["price"];
  stock: number | null;
  sold: number | null;
  color: string | null;
  size: string | null;
  permalink: string | null;
}>;

/** Convierte modelos de dominio en filas planas, sin lógica de atributos en JSX. */
export function createPublicationVariantRows(
  publication: PublicationDetail,
): readonly PublicationVariantTableRow[] {
  if (publication.variants.length > 0) {
    return publication.variants.map((variant) =>
      mapVariantRow(variant, variant.itemId ?? variant.id),
    );
  }

  return [
    {
      key: publication.id,
      imageUrl: publication.thumbnailUrl,
      publicationId: publication.id,
      userProductId: publication.group.userProductId,
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
  publicationId: string,
): PublicationVariantTableRow {
  return {
    key: variant.id,
    imageUrl: variant.thumbnailUrl,
    publicationId,
    userProductId: variant.userProductId,
    status: variant.status,
    price: variant.price,
    stock: variant.stock,
    sold: variant.sold,
    color: getAttributeValue(variant.attributes, "COLOR"),
    size: getAttributeValue(variant.attributes, "SIZE"),
    permalink: variant.permalink,
  };
}

export function getAttributeValue(
  attributes: readonly PublicationAttribute[],
  attributeId: "COLOR" | "SIZE",
): string | null {
  const attribute = attributes.find(
    (item) => item.id.trim().toUpperCase() === attributeId,
  );
  return attribute?.value?.trim() || null;
}
