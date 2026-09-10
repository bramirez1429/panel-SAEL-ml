import type { Publication, PublicationsPage } from "../domain/publication.model";
import type {
  GroupedPublicationDto,
  PublicationsResponseDto,
} from "./publications-response.schema";
import { mapLegacyVariations } from "./publication-detail.mapper";

type SharedProductDto = Extract<GroupedPublicationDto, { model: "SHARED" }>;
type FamilySummaryDto = Extract<
  GroupedPublicationDto,
  { model: "VARIANT_PRICING" }
>;

function mapSharedProduct(dto: SharedProductDto): Publication {
  const variants = mapLegacyVariations(dto.variations);
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
        : { from: dto.price, to: dto.price, currency: null },
    stock: variants.length > 0
      ? variants.reduce((total, variant) => total + (variant.stock ?? 0), 0)
      : dto.stock,
    sold: dto.sold,
    attributes: [],
    variants,
    group: {
      key: dto.key,
      productId: dto.product_id ?? null,
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
    variants: dto.variants.flatMap((variant) =>
      variant.items.map((item) => ({
        id: `${variant.userProductId}:${item.itemId}`,
        itemId: item.itemId,
        userProductId: variant.userProductId,
        label: null,
        title: item.title,
        thumbnailUrl: item.thumbnail,
        status: item.status,
        price: item.price === null ? null : { amount: item.price, currency: null },
        stock: item.stock,
        sold: item.sold,
        sku: getAttributeValue(item.attributes, "SELLER_SKU"),
        attributes: item.attributes.map((attribute) => ({
          id: attribute.id,
          value: attribute.value_name ?? attribute.values?.[0]?.name ?? null,
        })),
        permalink: null,
      })),
    ),
    group: {
      key: dto.key,
      productId: dto.product_id ?? null,
      type: "USER_PRODUCT",
      familyId: dto.familyId,
      userProductId: dto.variants[0]?.userProductId ?? null,
      itemId: null,
      childrenCount: dto.variantsCount,
    },
  };
}

function getAttributeValue(
  attributes: FamilySummaryDto["variants"][number]["items"][number]["attributes"],
  id: string,
): string | null {
  const attribute = attributes.find((item) => item.id.trim().toUpperCase() === id);
  return attribute?.value_name ?? attribute?.values?.[0]?.name ?? null;
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
