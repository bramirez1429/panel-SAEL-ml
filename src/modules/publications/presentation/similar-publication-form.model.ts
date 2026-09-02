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
  commonPrice?: number | null;
  variants: Record<string, {
    price: number | null;
    stock: number | null;
    sku: string;
  }>;
  attributes: Record<string, Record<string, string>>;
};

export type VariantPictures = Readonly<Record<string, readonly SimilarPublicationPicture[]>>;

export const CHILDREN_SIZES = ["6", "8", "10", "12", "14"] as const;

export function availableChildrenSizes(
  variants: readonly SimilarPublicationVariant[],
  values: Pick<SimilarPublicationFormValues, "attributes"> | undefined,
): readonly string[] {
  const existing = new Set(
    variants.flatMap((variant) => {
      const size = variant.attributes.find(
        ({ id }) => id.trim().toUpperCase() === "SIZE",
      );
      if (!size) return [];
      const edited = values?.attributes[variant.sourceReference]?.[size.id];
      return [(edited ?? size.valueName ?? "").trim()];
    }),
  );
  return CHILDREN_SIZES.filter((size) => !existing.has(size));
}

export function createAddedSizeVariant(
  template: SimilarPublicationVariant,
  size: string,
): SimilarPublicationVariant {
  const sizeAttribute = template.attributes.find(
    ({ id }) => id.trim().toUpperCase() === "SIZE",
  );
  if (!sizeAttribute || !CHILDREN_SIZES.includes(size as typeof CHILDREN_SIZES[number])) {
    throw new Error("El talle seleccionado no es válido.");
  }
  return {
    ...template,
    sourceReference: addedVariantReference(template.sourceReference, size),
    stock: 0,
    sku: null,
    pictureIds: [],
    attributes: template.attributes.map((attribute) =>
      attribute === sizeAttribute
        ? { ...attribute, valueId: null, valueName: size, values: [] }
        : attribute,
    ),
  };
}

export function isAddedSizeVariant(sourceReference: string): boolean {
  return sourceReference.startsWith("added-size:");
}

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
    commonPrice: commonPriceForDraft(draft),
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
  variants: readonly SimilarPublicationVariant[] = draft.variants,
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
    variants: variants.map((variant) => {
      const edited = values.variants[variant.sourceReference];
      const pictureIds = [
        ...commonPictures.map(({ id }) => id),
        ...(variantPictures[variant.sourceReference] ?? []).map(({ id }) => id),
      ];
      return {
        sourceReference: variant.sourceReference,
        price: commonPriceForDraft(draft) !== null
          ? values.commonPrice ?? 0
          : edited?.price ?? 0,
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

export function commonPriceForDraft(
  draft: SimilarPublicationDraft,
): number | null {
  if (draft.variants.length === 0) return null;

  const prices = draft.variants.map(({ price }) => price);

  if (prices.some((price) => typeof price !== "number")) {
    return null;
  }

  const first = prices[0];

  if (
    typeof first !== "number" ||
    !prices.every((price) => price === first)
  ) {
    return null;
  }

  return first;
}

export function variantsWithoutPictures(
  draft: SimilarPublicationDraft,
  commonPictures: readonly SimilarPublicationPicture[],
  variantPictures: VariantPictures,
  variants: readonly SimilarPublicationVariant[] = draft.variants,
): string[] {
  if (commonPictures.length > 0) return [];
  return variants
    .filter(({ sourceReference }) => !(variantPictures[sourceReference]?.length))
    .map(({ sourceReference }) => sourceReference);
}

function addedVariantReference(sourceReference: string, size: string): string {
  return `added-size:${encodeURIComponent(sourceReference)}:${size}`;
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
