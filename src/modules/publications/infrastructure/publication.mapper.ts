import type {
  Publication,
  PublicationsPage,
  PublicationType,
} from "../domain/publication.model";
import type {
  PublicationDto,
  PublicationsResponseDto,
} from "./publications-response.schema";

const PUBLICATION_TYPE_BY_MODEL = {
  SHARED: "LEGACY",
  VARIANT_PRICING: "USER_PRODUCT",
} as const satisfies Record<PublicationDto["model"], PublicationType>;

/**
 * Traduce el DTO validado al lenguaje del dominio. Es el único lugar donde
 * los modelos SHARED y VARIANT_PRICING se convierten en tipos de la UI.
 */
export function mapPublication(dto: PublicationDto): Publication {
  const hasPrice = dto.price_from !== null || dto.price_to !== null;

  return {
    id: dto.id,
    title: dto.family_name ?? dto.title,
    channel: "MERCADO_LIBRE",
    status: dto.status,
    thumbnailUrl: dto.thumbnail,
    permalink: dto.permalink,
    price: hasPrice
      ? {
          from: dto.price_from,
          to: dto.price_to,
          currency: dto.currency_id,
        }
      : null,
    stock: dto.stock_total,
    group: {
      key: dto.external_key,
      type: PUBLICATION_TYPE_BY_MODEL[dto.model],
      familyId: dto.family_id,
      itemId: dto.parent_item_id,
      childrenCount: dto.children_count,
    },
  };
}

export function mapPublicationsResponse(
  dto: PublicationsResponseDto,
): PublicationsPage {
  return {
    publications: dto.publications.map(mapPublication),
    page: dto.paging.page,
    pageSize: dto.paging.limit,
    count: dto.count,
    total: dto.paging.total,
    totalPages: dto.paging.totalPages,
  };
}
