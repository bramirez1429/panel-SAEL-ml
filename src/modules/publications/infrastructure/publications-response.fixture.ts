import type {
  GroupedPublicationDto,
  PublicationsResponseDto,
} from "./publications-response.schema";

export const legacyPublicationDto = {
  key: "item:MLA100",
  model: "SHARED",
  itemId: "MLA100",
  title: "Publicación clásica",
  price: 1000,
  stock: 5,
  sold: 2,
  status: "active",
  thumbnail: "https://example.com/legacy.jpg",
  variations: [],
} as const satisfies GroupedPublicationDto;

export const userProductPublicationDto = {
  key: "family:200",
  model: "VARIANT_PRICING",
  familyId: "200",
  familyName: "Familia real",
  variantsCount: 2,
  itemsCount: 2,
  variants: [
    {
      userProductId: "MLAU200",
      items: [
        {
          itemId: "MLA200",
          title: "Variante azul",
          price: 1500,
          stock: 2,
          sold: 7,
          status: "active",
          inventoryId: null,
          thumbnail: "https://example.com/MLA200.jpg",
          pictures: [],
          attributes: [{ id: "COLOR", value_name: "Azul" }],
        },
      ],
    },
    {
      userProductId: "MLAU201",
      items: [
        {
          itemId: "MLA201",
          title: "Variante roja",
          price: 1700,
          stock: 1,
          sold: 3,
          status: "active",
          inventoryId: null,
          thumbnail: null,
          pictures: [],
          attributes: [{ id: "COLOR", value_name: "Rojo" }],
        },
      ],
    },
  ],
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
