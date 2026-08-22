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
    group: {
      key: dto.familyId ? `family:${dto.familyId}` : `item:${dto.itemId}`,
      type: dto.model === "VARIANT_PRICING" ? "USER_PRODUCT" : "LEGACY",
      familyId: dto.familyId,
      itemId: dto.itemId,
      childrenCount: 0,
    },
    variants: [],
  };
}
