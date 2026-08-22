import type { PublicationDetailResponseDto } from "./publication-detail-response.schema";

export const legacyPublicationDetailResponse = {
  model: "SHARED",
  itemId: "MLA100",
  title: "Publicación clásica",
  familyId: null,
  familyName: null,
  status: "active",
  stock: { available: 5, sold: 2 },
  price: {
    current: 1000,
    regular: 1000,
    standard: 1000,
    currency: "ARS",
  },
  thumbnail: "https://example.com/legacy.jpg",
  permalink: "https://example.com/MLA100",
  attributes: [],
  variations: [],
} as const satisfies PublicationDetailResponseDto;

export const familyPublicationDetailResponse = {
  ...legacyPublicationDetailResponse,
  model: "VARIANT_PRICING",
  itemId: "MLA200",
  title: "Familia real",
  familyId: "200",
  familyName: "Familia real",
  stock: { available: 3, sold: 7 },
} as const satisfies PublicationDetailResponseDto;
