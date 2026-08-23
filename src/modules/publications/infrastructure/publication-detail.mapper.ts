import type { PublicationDetail } from "../domain/publication.model";
import type { PublicationDetailResponseDto } from "./publication-detail-response.schema";

/** Traduce el detalle real de NestJS al modelo de dominio del frontend. */
export function mapPublicationDetail(
  dto: PublicationDetailResponseDto,
): PublicationDetail {
  const currentPrice = dto.price.current;

  return {
    id: dto.itemId,
    title: dto.title ?? dto.itemId,
    channel: "MERCADO_LIBRE",
    status: dto.status,
    thumbnailUrl: dto.thumbnail,
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
      userProductId: dto.userProductId ?? null,
      itemId: dto.itemId,
      childrenCount: 0,
    },
    variants: mapVariations(dto.variations),
  };
}

function mapVariations(variations: readonly unknown[]): PublicationDetail["variants"] {
  return variations.flatMap((variation) => {
    if (!isRecord(variation)) return [];

    const id = readString(variation.id);
    if (!id) return [];
    const attributes = isRecordArray(variation.attribute_combinations)
      ? variation.attribute_combinations.flatMap((attribute) => {
          const attributeId = readString(attribute.id);
          return attributeId
            ? [{ id: attributeId, value: readString(attribute.value_name) }]
            : [];
        })
      : [];
    const price = readNumber(variation.price);

    return [
      {
        id,
        itemId: null,
        userProductId: null,
        label: null,
        title: null,
        thumbnailUrl: null,
        status: null,
        price: price === null ? null : { amount: price, currency: null },
        stock: readNumber(variation.available_quantity),
        sold: readNumber(variation.sold_quantity),
        attributes,
        permalink: null,
      },
    ];
  });
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
