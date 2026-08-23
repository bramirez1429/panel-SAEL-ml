import type {
  FamilyDetailResponseDto,
  PublicationDetailResponseDto,
} from "./publication-detail-response.schema";

export const familyDetailResponse = {
  model: "VARIANT_PRICING",
  familyId: "200",
  familyName: "Familia real",
  userProductsCount: 1,
  itemsCount: 2,
  userProductIds: ["UP-200"],
  variants: [
    {
      itemId: "MLA201",
      userProductId: "UP-200",
      title: "Variante azul",
      status: "active",
      stock: { available: 4, sold: 2 },
      price: { current: 1200, currency: "ARS" },
      thumbnail: "https://example.com/blue.jpg",
      attributes: [{ id: "COLOR", value_name: "Azul" }],
      permalink: "https://example.com/MLA201",
    },
    {
      itemId: "MLA202",
      userProductId: "UP-200",
      title: "Variante roja",
      status: "paused",
      stock: { available: 1, sold: 5 },
      price: { current: 1300, currency: "ARS" },
      thumbnail: null,
      attributes: [{ id: "SIZE", value_name: "M" }],
      permalink: null,
    },
  ],
} satisfies FamilyDetailResponseDto;

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
  userProductId: "UP-200",
  stock: { available: 3, sold: 7 },
} as const satisfies PublicationDetailResponseDto;
