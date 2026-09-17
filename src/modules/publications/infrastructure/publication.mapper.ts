import type { Publication, PublicationsPage } from "../domain/publication.model";
import type {
  GroupedPublicationDto,
  PublicationsResponseDto,
} from "./publications-response.schema";

type SharedProductDto = Extract<GroupedPublicationDto, { model: "SHARED" }>;
type FamilySummaryDto = Extract<
  GroupedPublicationDto,
  { model: "VARIANT_PRICING" }
>;

function mapSharedProduct(dto: SharedProductDto): Publication {
  return {
    id: dto.itemId,
    title: dto.title ?? dto.itemId,
    channel: "MERCADO_LIBRE",
    status: dto.status,
    thumbnailUrl: dto.thumbnail,
    permalink: null,
    price:
      dto.price === null
        ? null
        : { from: dto.price, to: dto.price, currency: dto.currency },
    stock: dto.stock,
    sold: dto.sold,
    attributes: [],
    group: {
      key: dto.key,
      productId: dto.product_id ?? null,
      type: "LEGACY",
      familyId: null,
      userProductId: null,
      itemId: dto.itemId,
      childrenCount: dto.variantsCount,
    },
  };
}

function mapFamilySummary(dto: FamilySummaryDto): Publication {
  return {
    id: dto.itemId,
    title: dto.familyName ?? dto.title ?? dto.itemId,
    channel: "MERCADO_LIBRE",
    status: null,
    thumbnailUrl: dto.thumbnail,
    permalink: dto.permalink,
    price:
      dto.priceFrom === null && dto.priceTo === null
        ? null
        : {
            from: dto.priceFrom,
            to: dto.priceTo,
            currency: dto.currency,
          },
    stock: dto.stock,
    sold: dto.sold,
    attributes: [],
    group: {
      key: dto.key,
      productId: dto.product_id ?? null,
      type: "USER_PRODUCT",
      familyId: dto.familyId,
      userProductId: dto.userProductId,
      itemId: null,
      childrenCount: dto.variantsCount,
    },
  };
}

/** Convierte el DTO agrupado real al modelo propio de la UI. */
export function mapPublication(dto: GroupedPublicationDto): Publication {
  return dto.model === "SHARED"
    ? mapSharedProduct(dto)
    : mapFamilySummary(dto);
}

export function mapPublicationsResponse(
  dto: PublicationsResponseDto,
  pageSize = 20,
  cursor: string | null = null,
): PublicationsPage {
  return {
    publications: dto.products.map(mapPublication),
    page: 1,
    pageSize,
    cursor,
    nextCursor: dto.nextCursor,
    done: dto.done,
    count: dto.products.length,
    productsCount: dto.productsCount,
  };
}
