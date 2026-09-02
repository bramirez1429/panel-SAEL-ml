import type {
  PublicationDetail,
  PublicationPicture,
} from "../domain/publication.model";
import type {
  FamilyDetailResponseDto,
  PublicationDetailResponseDto,
  PublicationPictureDto,
} from "./publication-detail-response.schema";

/** Traduce el detalle real de NestJS al modelo de dominio del frontend. */
export function mapPublicationDetail(
  dto: PublicationDetailResponseDto,
  familyDto?: FamilyDetailResponseDto,
): PublicationDetail {
  const currentPrice = dto.price.current;
  const pictures = mapPictures(dto.pictures);

  return {
    id: dto.itemId,
    title: dto.title ?? dto.itemId,
    channel: "MERCADO_LIBRE",
    status: dto.status,
    thumbnailUrl: dto.thumbnail,
    pictures,
    permalink: dto.permalink,
    price:
      currentPrice === null
        ? null
        : {
            from: currentPrice,
            to: currentPrice,
            currency: dto.price.currency,
          },
    stock: dto.stock.available,
    sold: dto.stock.sold,
    attributes: dto.attributes.map((attribute) => ({
      id: attribute.id,
      value: attribute.value_name ?? null,
    })),
    group: {
      key: dto.familyId ? `family:${dto.familyId}` : `item:${dto.itemId}`,
      type: dto.model === "VARIANT_PRICING" ? "USER_PRODUCT" : "LEGACY",
      familyId: dto.familyId,
      userProductId:
        dto.userProductId ?? familyDto?.variants[0]?.userProductId ?? null,
      itemId: dto.itemId,
      childrenCount: familyDto?.itemsCount ?? 0,
    },
    variants: familyDto
      ? familyDto.variants.map(mapFamilyVariant)
      : mapVariations(dto.variations, pictures),
  };
}

function mapFamilyVariant(
  variant: FamilyDetailResponseDto["variants"][number],
): PublicationDetail["variants"][number] {
  return {
    id: variant.itemId,
    itemId: variant.itemId,
    userProductId: variant.userProductId,
    label: null,
    title: variant.title,
    thumbnailUrl: variant.thumbnail,
    pictures: mapPictures(variant.pictures),
    status: variant.status,
    price:
      variant.price.current === null
        ? null
        : {
            amount: variant.price.current,
            currency: variant.price.currency ?? null,
          },
    stock: variant.stock.available,
    sold: variant.stock.sold,
    sku:
      variant.sku?.sellerCustomField?.trim() ||
      readAttributeValue(variant.attributes, "SELLER_SKU"),
    attributes: variant.attributes.map((attribute) => ({
      id: attribute.id,
      value: attribute.value_name ?? null,
    })),
    permalink: variant.permalink,
  };
}

function mapVariations(
  variations: readonly unknown[],
  publicationPictures: readonly PublicationPicture[],
): PublicationDetail["variants"] {
  return variations.flatMap((variation) => {
    if (!isRecord(variation)) return [];

    const id = readString(variation.id);
    if (!id) return [];
    const attributes = [
      ...(isRecordArray(variation.attribute_combinations) ? variation.attribute_combinations : []),
      ...(isRecordArray(variation.attributes) ? variation.attributes : []),
    ].flatMap((attribute) => {
          const attributeId = readString(attribute.id);
          return attributeId
            ? [{ id: attributeId, value: readAttributeText(attribute) }]
            : [];
        });
    const price = readNumber(variation.price);
    const pictures = resolveVariationPictures(variation, publicationPictures);

    return [
      {
        id,
        itemId: null,
        userProductId: null,
        label: null,
        title: null,
        thumbnailUrl: pictures[0]?.url ?? null,
        pictures,
        status: null,
        price: price === null ? null : { amount: price, currency: null },
        stock: readNumber(variation.available_quantity),
        sold: readNumber(variation.sold_quantity),
        sku: readAttributeValue(attributes, "SELLER_SKU"),
        attributes,
        permalink: null,
      },
    ];
  });
}

function mapPictures(
  pictures: readonly PublicationPictureDto[],
): readonly PublicationPicture[] {
  return pictures.flatMap((picture) => {
    const url = picture.secure_url?.trim() || picture.url?.trim();
    return url ? [{ id: picture.id, url }] : [];
  });
}

function resolveVariationPictures(
  variation: Record<string, unknown>,
  publicationPictures: readonly PublicationPicture[],
): readonly PublicationPicture[] {
  const ids = Array.isArray(variation.picture_ids)
    ? variation.picture_ids.flatMap((value) => {
        const id = readString(value);
        return id ? [id] : [];
      })
    : [];
  if (ids.length === 0) return [];
  const picturesById = new Map(
    publicationPictures.map((picture) => [picture.id, picture]),
  );
  return ids.flatMap((id) => {
    const picture = picturesById.get(id);
    return picture ? [picture] : [];
  });
}

function readAttributeValue(
  attributes: readonly Record<string, unknown>[],
  id: string,
): string | null {
  const attribute = attributes.find((item) => readString(item.id)?.trim().toUpperCase() === id);
  return readAttributeText(attribute);
}

function readAttributeText(attribute: Record<string, unknown> | undefined): string | null {
  if (!attribute) return null;
  for (const key of ["value_name", "valueName", "value", "name"]) {
    const value = readString(attribute[key]);
    if (value) return value.trim();
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isRecord);
}

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  return typeof value === "number" && Number.isSafeInteger(value)
    ? String(value)
    : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
