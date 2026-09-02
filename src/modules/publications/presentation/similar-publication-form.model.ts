import type {
  SimilarPublicationAttribute,
  SimilarPublicationCreateInput,
  SimilarPublicationDraft,
  SimilarPublicationPicture,
  SimilarPublicationVariant,
  SimilarPublicationAttributeOption,
  SimilarPublicationPackage,
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
  package?: {
    hasFactoryPackaging: boolean | null;
    widthCm: number | null;
    heightCm: number | null;
    lengthCm: number | null;
    weightKg: number | null;
  };
  variants: Record<string, {
    price: number | null;
    stock: number | null;
    sku: string;
  }>;
  attributes: Record<string, Record<string, string>>;
};

export type VariantPictures = Readonly<
  Record<string, readonly SimilarPublicationPicture[]>
>;

export const CHILDREN_SIZES = ["6", "8", "10", "12", "14"] as const;
export const WOMEN_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;

export function availableVariantSizes(
  variants: readonly SimilarPublicationVariant[],
  values: Pick<SimilarPublicationFormValues, "attributes"> | undefined,
): readonly string[] {
  const existing = variants
    .map((variant) => readVariantValue(variant, values, "SIZE"))
    .filter((value): value is string => Boolean(value))
    .map(normalizeValue);

  const sizeAttribute = variants
    .map(findSizeAttribute)
    .find((attribute) => (attribute?.options?.length ?? 0) > 0);

  const mlSizes = uniqueNames(sizeAttribute?.options);

  const scale = mlSizes.length > 0
    ? mlSizes
    : fallbackSizeScale(existing);

  return scale.filter(
    (size) => !existing.includes(normalizeValue(size)),
  );
}

export function availableVariantColors(
  variants: readonly SimilarPublicationVariant[],
  values: Pick<SimilarPublicationFormValues, "attributes"> | undefined,
): readonly SimilarPublicationAttributeOption[] {
  const colorAttribute = variants
    .map(findColorAttribute)
    .find((attribute) => (attribute?.options?.length ?? 0) > 0);

  const existing = new Set(
    variants
      .map((variant) => readVariantValue(variant, values, "COLOR"))
      .filter((value): value is string => Boolean(value))
      .map(normalizeValue),
  );

  const seen = new Set<string>();

  return (colorAttribute?.options ?? []).filter((option) => {
    const name = option.name?.trim();
    if (!name) return false;

    const normalized = normalizeValue(name);

    if (seen.has(normalized) || existing.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

export function createAddedSizeVariant(
  template: SimilarPublicationVariant,
  size: string,
): SimilarPublicationVariant {
  const sizeAttribute = findSizeAttribute(template);

  if (!sizeAttribute) {
    throw new Error("La publicación no tiene atributo de talle.");
  }

  const option = sizeAttribute.options?.find(
    ({ name }) => name && normalizeValue(name) === normalizeValue(size),
  );

  const fallback = fallbackSizeScale([
    normalizeValue(sizeAttribute.valueName ?? ""),
  ]);

  const canonical =
    option?.name ??
    fallback.find(
      (candidate) => normalizeValue(candidate) === normalizeValue(size),
    );

  if (!canonical) {
    throw new Error("El talle seleccionado no es válido.");
  }

  return {
    ...template,
    sourceReference: addedSizeReference(template.sourceReference, canonical),
    stock: 0,
    sku: null,
    pictureIds: [],
    attributes: template.attributes.map((attribute) => {
      if (attribute === sizeAttribute) {
        return {
          ...attribute,
          valueId: option?.id ?? null,
          valueName: canonical,
          values: [],
        };
      }

      return clearIdentifier(attribute);
    }),
  };
}

export function createAddedColorVariant(
  template: SimilarPublicationVariant,
  option: SimilarPublicationAttributeOption,
): SimilarPublicationVariant {
  const colorAttribute = findColorAttribute(template);
  const colorName = option.name?.trim();

  if (!colorAttribute || !colorName) {
    throw new Error("El color seleccionado no es válido.");
  }

  return {
    ...template,
    sourceReference: addedColorReference(
      template.sourceReference,
      option.id ?? colorName,
    ),
    stock: 0,
    sku: null,
    pictureIds: [],
    attributes: template.attributes.map((attribute) => {
      if (attribute === colorAttribute) {
        return {
          ...attribute,
          valueId: option.id,
          valueName: colorName,
          values: [],
          display: {
            colorHex: option.colorHex ?? null,
          },
        };
      }

      return clearIdentifier(attribute);
    }),
  };
}

export function isAddedSizeVariant(sourceReference: string): boolean {
  return sourceReference.startsWith("added-size:");
}

export function isAddedColorVariant(sourceReference: string): boolean {
  return sourceReference.startsWith("added-color:");
}

function findSizeAttribute(
  variant: SimilarPublicationVariant,
): SimilarPublicationAttribute | undefined {
  return variant.attributes.find(
    (attribute) =>
      attribute.role === "SIZE" ||
      attribute.id.trim().toUpperCase() === "SIZE" ||
      attribute.name?.toLocaleLowerCase().includes("talle") === true,
  );
}

function findColorAttribute(
  variant: SimilarPublicationVariant,
): SimilarPublicationAttribute | undefined {
  return variant.attributes.find(
    (attribute) =>
      attribute.role === "COLOR" ||
      attribute.id.trim().toUpperCase() === "COLOR",
  );
}

function readVariantValue(
  variant: SimilarPublicationVariant,
  values: Pick<SimilarPublicationFormValues, "attributes"> | undefined,
  role: "SIZE" | "COLOR",
): string | null {
  const attribute =
    role === "SIZE"
      ? findSizeAttribute(variant)
      : findColorAttribute(variant);

  if (!attribute) return null;

  const edited =
    values?.attributes[variant.sourceReference]?.[attribute.id];

  return (edited ?? attribute.valueName ?? "").trim() || null;
}

function uniqueNames(
  options: readonly SimilarPublicationAttributeOption[] | undefined,
): string[] {
  const seen = new Set<string>();

  return (options ?? []).flatMap(({ name }) => {
    const value = name?.trim();
    if (!value) return [];

    const normalized = normalizeValue(value);

    if (seen.has(normalized)) return [];

    seen.add(normalized);
    return [value];
  });
}

function fallbackSizeScale(existing: readonly string[]): readonly string[] {
  const sample = existing.find(Boolean);
  if (!sample) return [];

  if (
    CHILDREN_SIZES.some(
      (size) => normalizeValue(size) === sample,
    )
  ) {
    return CHILDREN_SIZES;
  }

  if (
    WOMEN_SIZES.some(
      (size) => normalizeValue(size) === sample,
    )
  ) {
    return WOMEN_SIZES;
  }

  return [];
}

function clearIdentifier(
  attribute: SimilarPublicationAttribute,
): SimilarPublicationAttribute {
  if (!isProductIdentifierAttribute(attribute.id)) {
    return attribute;
  }

  return {
    ...attribute,
    valueId: null,
    valueName: null,
    values: [],
  };
}

function normalizeValue(value: string): string {
  return value.trim().toLocaleUpperCase("es-AR").replace(/\s+/g, "");
}

function addedSizeReference(
  sourceReference: string,
  size: string,
): string {
  return "added-size:" +
    encodeURIComponent(sourceReference) +
    ":" +
    encodeURIComponent(size);
}

function addedColorReference(
  sourceReference: string,
  color: string,
): string {
  return "added-color:" +
    encodeURIComponent(sourceReference) +
    ":" +
    encodeURIComponent(color);
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

function packageFromValues(
  value: SimilarPublicationFormValues["package"],
): SimilarPublicationPackage | undefined {
  if (!value) return undefined;

  const hasValue =
    value.hasFactoryPackaging !== null ||
    value.widthCm !== null ||
    value.heightCm !== null ||
    value.lengthCm !== null ||
    value.weightKg !== null;

  if (!hasValue) return undefined;

  return {
    hasFactoryPackaging: value.hasFactoryPackaging,
    widthCm: value.widthCm,
    heightCm: value.heightCm,
    lengthCm: value.lengthCm,
    weightKg: value.weightKg,
  };
}

function optional(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function required(value: string | undefined): string {
  return value?.trim() ?? "";
}
