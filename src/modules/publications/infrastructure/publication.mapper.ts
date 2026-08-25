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
    productId: dto.product_id ?? null,
    title: dto.title ?? dto.itemId,
    channel: "MERCADO_LIBRE",
    status: dto.status,
    thumbnailUrl: dto.thumbnail,
    permalink: null,
    price:
      dto.price === null
        ? null
        : { from: dto.price, to: dto.price, currency: null },
    stock: dto.stock,
    sold: dto.sold,
    attributes: [],
    group: {
      key: dto.key,
      type: "LEGACY",
      familyId: null,
      userProductId: null,
      itemId: dto.itemId,
      childrenCount: 0,
    },
  };
}

function mapFamilySummary(dto: FamilySummaryDto): Publication {
  const items = dto.variants.flatMap((variant) => variant.items);
  const prices = items.flatMap((item) =>
    item.price === null ? [] : [item.price],
  );
  const firstItem = items[0];

  return {
    id: firstItem?.itemId ?? dto.familyId,
    productId: dto.product_id ?? firstItem?.product_id ?? null,
    title: dto.familyName ?? firstItem?.title ?? dto.familyId,
    channel: "MERCADO_LIBRE",
    status: null,
    thumbnailUrl: firstItem?.thumbnail ?? null,
    permalink: null,
    price:
      prices.length === 0
        ? null
        : {
            from: Math.min(...prices),
            to: Math.max(...prices),
            currency: null,
          },
    stock: items.reduce((total, item) => total + item.stock, 0),
    sold: items.reduce((total, item) => total + item.sold, 0),
    attributes: [],
    group: {
      key: dto.key,
      type: "USER_PRODUCT",
      familyId: dto.familyId,
      userProductId: dto.variants[0]?.userProductId ?? null,
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
