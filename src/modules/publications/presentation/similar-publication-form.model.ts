import type {
  SimilarPublicationAttribute,
  SimilarPublicationCreateInput,
  SimilarPublicationDraft,
  SimilarPublicationPicture,
} from "../domain/similar-publication.model";
import { isProductIdentifierAttribute } from "../domain/similar-publication.model";

export type SimilarPublicationFormValues = {
  familyName?: string;
  titleTemplate?: string;
  description?: string;
  categoryId?: string;
  currencyId?: string;
  listingTypeId?: string;
  buyingMode?: string;
  publishToTiendanube: boolean;
  tiendanubeCategoryId?: number;
  variants: Record<string, {
    price: number | null;
    stock: number | null;
    sku: string;
  }>;
  attributes: Record<string, Record<string, string>>;
};

export type VariantPictures = Readonly<Record<string, readonly SimilarPublicationPicture[]>>;

export function createInitialSimilarPublicationValues(
  draft: SimilarPublicationDraft,
): SimilarPublicationFormValues {
  return {
    familyName: draft.sourceType === "USER_PRODUCT" ? draft.familyName ?? undefined : undefined,
    titleTemplate: draft.sourceType === "LEGACY" ? draft.titleTemplate ?? undefined : undefined,
    description: draft.description ?? undefined,
    categoryId: draft.categoryId ?? undefined,
    currencyId: draft.currencyId ?? undefined,
    listingTypeId: draft.listingTypeId ?? undefined,
    buyingMode: draft.buyingMode ?? undefined,
    publishToTiendanube: false,
    variants: Object.fromEntries(draft.variants.map((variant) => [
      variant.sourceReference,
      { price: variant.price, stock: variant.stock, sku: "" },
    ])),
    attributes: Object.fromEntries(draft.variants.map((variant) => [
      variant.sourceReference,
      Object.fromEntries(variant.attributes.map((attribute) => [
        attribute.id,
        isProductIdentifierAttribute(attribute.id)
          ? ""
          : attributeDisplayValue(attribute),
      ])),
    ])),
  };
}

export function buildSimilarPublicationInput(
  draft: SimilarPublicationDraft,
  values: SimilarPublicationFormValues,
  commonPictures: readonly SimilarPublicationPicture[],
  variantPictures: VariantPictures,
): SimilarPublicationCreateInput {
  return {
    sourceKey: draft.sourceKey,
    categoryId: required(values.categoryId),
    familyName: draft.sourceType === "USER_PRODUCT" ? optional(values.familyName) : null,
    titleTemplate: draft.sourceType === "LEGACY" ? optional(values.titleTemplate) : null,
    description: optional(values.description),
    currencyId: required(values.currencyId),
    listingTypeId: required(values.listingTypeId),
    buyingMode: required(values.buyingMode),
    saleTerms: draft.saleTerms,
    shipping: draft.shipping,
    channels: draft.channels,
    pictures: commonPictures.map(({ id }) => id),
    variants: draft.variants.map((variant) => {
      const edited = values.variants[variant.sourceReference];
      const pictureIds = [
        ...commonPictures.map(({ id }) => id),
        ...(variantPictures[variant.sourceReference] ?? []).map(({ id }) => id),
      ];
      return {
        sourceReference: variant.sourceReference,
        price: edited?.price ?? 0,
        stock: edited?.stock ?? 0,
        sku: optional(edited?.sku),
        attributes: variant.attributes.map((attribute) => mapAttribute(
          attribute,
          values.attributes[variant.sourceReference]?.[attribute.id] ?? "",
        )),
        pictureIds: [...new Set(pictureIds)],
      };
    }),
  };
}

export function variantsWithoutPictures(
  draft: SimilarPublicationDraft,
  commonPictures: readonly SimilarPublicationPicture[],
  variantPictures: VariantPictures,
): string[] {
  if (commonPictures.length > 0) return [];
  return draft.variants
    .filter(({ sourceReference }) => !(variantPictures[sourceReference]?.length))
    .map(({ sourceReference }) => sourceReference);
}

export function familyNameIsUnchanged(
  candidate: string | undefined,
  original: string | null,
): boolean {
  return Boolean(
    original && candidate?.trim() &&
    candidate.trim().localeCompare(original.trim(), "es", { sensitivity: "base" }) === 0,
  );
}

function mapAttribute(
  attribute: SimilarPublicationAttribute,
  input: string,
): SimilarPublicationAttribute {
  const normalized = optional(input);
  if (!isProductIdentifierAttribute(attribute.id) && input === attributeDisplayValue(attribute)) {
    return attribute;
  }
  return {
    ...attribute,
    valueId: null,
    valueName: normalized,
    values: [],
  };
}

function attributeDisplayValue(attribute: SimilarPublicationAttribute): string {
  return attribute.valueName ?? attribute.values.flatMap(({ name }) => name ?? []).join(", ");
}

function optional(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function required(value: string | undefined): string {
  return value?.trim() ?? "";
}
