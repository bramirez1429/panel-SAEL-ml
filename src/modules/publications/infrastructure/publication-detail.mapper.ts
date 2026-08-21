import type {
  PublicationAttribute,
  PublicationDetail,
  PublicationVariant,
} from "../domain/publication.model";
import type {
  PublicationAttributeDto,
  PublicationChildDto,
  PublicationDetailResponseDto,
  SharedVariationDto,
} from "./publication-detail-response.schema";
import { mapPublication } from "./publication.mapper";

function mapAttribute(dto: PublicationAttributeDto): PublicationAttribute {
  return { id: dto.id, value: dto.valueName };
}

function mapSharedVariation(dto: SharedVariationDto): PublicationVariant {
  return {
    id: dto.id,
    itemId: null,
    userProductId: null,
    label: dto.label,
    title: null,
    thumbnailUrl: null,
    status: null,
    price: null,
    stock: dto.availableQuantity,
    sold: dto.soldQuantity,
    attributes: dto.attributes.map(mapAttribute),
    permalink: null,
  };
}

function mapChild(dto: PublicationChildDto): PublicationVariant {
  return {
    id: dto.id,
    itemId: dto.item_id,
    userProductId: dto.user_product_id,
    label: dto.variant_label,
    title: dto.title,
    thumbnailUrl: dto.thumbnail,
    status: dto.status,
    price:
      dto.price === null
        ? null
        : { amount: dto.price, currency: dto.currency_id },
    stock: dto.available_quantity,
    sold: dto.sold_quantity,
    attributes: dto.attributes.map(mapAttribute),
    permalink: dto.permalink,
  };
}

/**
 * Traduce el detalle validado al modelo propio. No filtra nombres de tablas ni
 * formas JSON del backend hacia application o presentation.
 */
export function mapPublicationDetail(
  dto: PublicationDetailResponseDto,
): PublicationDetail {
  const publication = mapPublication(dto.product);
  const variants =
    "children" in dto
      ? dto.children.map(mapChild)
      : dto.product.shared_variations.map(mapSharedVariation);

  return {
    ...publication,
    sold:
      variants.length === 0
        ? null
        : variants.reduce((total, variant) => total + variant.sold, 0),
    variants,
  };
}
