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

export const ADULT_SIZES = ["S", "M", "L", "XL", "2XL"] as const;
export const GIRLS_SIZES = ["6", "8", "10", "12", "14"] as const;

export function availableVariantSizes(
  variants: readonly SimilarPublicationVariant[],
  values: Pick<SimilarPublicationFormValues, "attributes"> | undefined,
): readonly string[] {
  const existing = new Set(
    variants
      .map((variant) =>
        readVariantValue(
          variant,
          values,
          "SIZE",
        ),
      )
      .filter(
        (value): value is string =>
          Boolean(value),
      )
      .map(normalizeValue),
  );

  return [
    ...ADULT_SIZES,
    ...GIRLS_SIZES,
  ].filter(
    (size) =>
      !existing.has(normalizeValue(size)),
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
  const validSizes = new Set<string>([
    ...ADULT_SIZES,
    ...GIRLS_SIZES,
  ]);

  if (!validSizes.has(size)) {
    throw new Error(
      "El talle seleccionado no es válido.",
    );
  }

  const sizeAttribute =
    findSizeAttribute(template);

  const attributes =
    sizeAttribute
      ? template.attributes.map(
          (attribute) => {
            if (
              attribute === sizeAttribute
            ) {
              return {
                ...attribute,
                valueId: null,
                valueName: size,
                values: [],
              };
            }

            return clearIdentifier(
              attribute,
            );
          },
        )
      : [
          ...template.attributes.map(
            clearIdentifier,
          ),
          {
            id: "SIZE",
            name: "Talle",
            valueId: null,
            valueName: size,
            values: [],
            role: "SIZE" as const,
            editable: true,
          },
        ];

  return {
    ...template,
    sourceReference:
      addedSizeReference(
        template.sourceReference,
        size,
      ),
    stock: 0,
    sku: null,
    pictureIds: [],
    attributes,
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
  const candidates = variant.attributes.filter(
    (attribute) =>
      !attribute.id
        .trim()
        .toUpperCase()
        .startsWith("SIZE_GRID"),
  );

  return (
    candidates.find(
      (attribute) =>
        attribute.id
          .trim()
          .toUpperCase() === "SIZE",
    ) ??
    candidates.find(
      (attribute) =>
        attribute.role === "SIZE",
    ) ??
    candidates.find(
      (attribute) =>
        attribute.name
          ?.toLocaleLowerCase()
          .includes("talle") === true,
    )
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
    values?.attributes[
      variant.sourceReference
    ]?.[attribute.id];

  const value =
    (edited ??
      attribute.valueName ??
      "")
      .trim();

  if (!value) return null;

  if (
    role === "SIZE" &&
    /^\d+:\d+$/u.test(value)
  ) {
    return null;
  }

  return value;
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
