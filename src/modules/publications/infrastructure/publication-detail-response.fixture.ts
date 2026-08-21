import type {
  FamilyPublicationDetailResponseDto,
  SharedPublicationDetailResponseDto,
} from "./publication-detail-response.schema";
import {
  legacyPublicationDto,
  userProductPublicationDto,
} from "./publications-response.fixture";

export const legacyPublicationDetailResponse: SharedPublicationDetailResponseDto = {
  product: {
    ...legacyPublicationDto,
    model: "SHARED",
    shared_variations: [
      {
        id: "1001",
        label: "Azul",
        availableQuantity: 3,
        soldQuantity: 4,
        attributes: [{ id: "COLOR", valueName: "Azul" }],
      },
    ],
    created_at: "2026-08-19T10:01:00.000Z",
  },
};

export const familyPublicationDetailResponse: FamilyPublicationDetailResponseDto = {
  product: {
    ...userProductPublicationDto,
    model: "VARIANT_PRICING",
    shared_variations: [],
    created_at: "2026-08-19T10:01:00.000Z",
  },
  children: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      product_id: userProductPublicationDto.id,
      item_id: "MLA200",
      user_product_id: "MLAU200",
      variant_label: "Azul / 42",
      title: "Variante azul",
      thumbnail: "https://example.com/MLA200.jpg",
      status: "active",
      currency_id: "ARS",
      listing_type_id: "gold_special",
      price: 1500,
      available_quantity: 2,
      sold_quantity: 7,
      attributes: [
        { id: "COLOR", valueName: "Azul" },
        { id: "SIZE", valueName: "42" },
      ],
      permalink: "https://example.com/MLA200",
      source_updated_at: "2026-08-20T10:00:00.000Z",
      last_synced_at: "2026-08-20T10:01:00.000Z",
      created_at: "2026-08-19T10:01:00.000Z",
      updated_at: "2026-08-20T10:01:00.000Z",
    },
  ],
};
