import type {
  PublicationDto,
  PublicationsResponseDto,
} from "./publications-response.schema";

export const legacyPublicationDto = {
  id: "11111111-1111-4111-8111-111111111111",
  seller_id: 123,
  external_key: "item:MLA100",
  model: "SHARED",
  family_id: null,
  parent_item_id: "MLA100",
  family_name: null,
  title: "Publicación clásica",
  thumbnail: "https://example.com/legacy.jpg",
  status: "active",
  category_id: "MLA1",
  currency_id: "ARS",
  price_from: 1000,
  price_to: 1000,
  stock_total: 5,
  children_count: 0,
  permalink: "https://example.com/MLA100",
  source_updated_at: "2026-08-20T10:00:00.000Z",
  last_synced_at: "2026-08-20T10:01:00.000Z",
  updated_at: "2026-08-20T10:01:00.000Z",
} as const satisfies PublicationDto;

export const userProductPublicationDto = {
  ...legacyPublicationDto,
  id: "22222222-2222-4222-8222-222222222222",
  external_key: "family:200",
  model: "VARIANT_PRICING",
  family_id: "200",
  parent_item_id: null,
  family_name: "Familia real",
  title: "Título de respaldo",
  children_count: 3,
} as const satisfies PublicationDto;

export function createPublicationsResponse(
  publications: readonly PublicationDto[] = [legacyPublicationDto],
): PublicationsResponseDto {
  return {
    paging: {
      page: 1,
      limit: 20,
      total: publications.length,
      totalPages: publications.length === 0 ? 0 : 1,
    },
    count: publications.length,
    publications: [...publications],
  };
}
