import type {
  GroupedPublicationDto,
  PublicationsResponseDto,
} from "./publications-response.schema";

export const legacyPublicationDto = {
  key: "item:MLA100",
  model: "SHARED",
  product_id: "123e4567-e89b-42d3-a456-426614174000",
  itemId: "MLA100",
  title: "Publicación clásica",
  price: 1000,
  stock: 5,
  sold: 2,
  status: "active",
  thumbnail: "https://example.com/legacy.jpg",
  permalink: "https://example.com/MLA100",
  currency: "ARS",
  variantsCount: 0,
} as const satisfies GroupedPublicationDto;

export const userProductPublicationDto = {
  key: "family:200",
  model: "VARIANT_PRICING",
  familyId: "200",
  familyName: "Familia real",
  variantsCount: 2,
  itemsCount: 2,
  itemId: null,
  userProductId: "MLAU200",
  title: "Variante azul",
  priceFrom: 1500,
  priceTo: 1700,
  currency: "ARS",
  stock: 3,
  sold: 10,
  status: "active",
  thumbnail: "https://example.com/MLA200.jpg",
  permalink: "https://example.com/MLA200",
} as const satisfies GroupedPublicationDto;

export function createPublicationsResponse(
  products: readonly GroupedPublicationDto[] = [legacyPublicationDto],
): PublicationsResponseDto {
  return {
    done: true,
    nextCursor: null,
    rawItemsCount: products.length,
    productsCount: products.length,
    products: [...products],
  };
}
