import type {
  SimilarPublicationPicture,
  SimilarPublicationVariant,
} from "../domain/similar-publication.model";
import type {
  SimilarPublicationFormValues,
  VariantPictures,
} from "./similar-publication-form.model";

export type SimilarPublicationVariantCard = Readonly<{
  key: string;
  color: string | null;
  pictures: readonly SimilarPublicationVariantPicture[];
  variants: readonly SimilarPublicationCardVariant[];
  stockTotal: number | null;
  complete: boolean;
  commonPicturesCount: number;
}>;

export type SimilarPublicationVariantPicture = Readonly<{
  key: string;
  sourceReference: string;
  picture: SimilarPublicationPicture;
}>;

export type SimilarPublicationCardVariant = Readonly<{
  sourceReference: string;
  variant: SimilarPublicationVariant;
  color: string | null;
  size: string | null;
  stock: number | null;
  sku: string;
  price: number | null;
}>;

export type SimilarPublicationVariantSummary = Readonly<{
  colors: number;
  variants: number;
  pictures: number;
  units: number;
}>;

export function createSimilarPublicationVariantCards(
  variants: readonly SimilarPublicationVariant[],
  values: Pick<SimilarPublicationFormValues, "attributes" | "variants"> | undefined,
  picturesByVariant: VariantPictures,
  commonPictures: readonly SimilarPublicationPicture[],
): readonly SimilarPublicationVariantCard[] {
  const groups = new Map<string, SimilarPublicationCardVariant[]>();

  for (const variant of variants) {
    const cardVariant = createCardVariant(variant, values);
    const key = cardVariantColorKey(cardVariant);
    groups.set(key, [...(groups.get(key) ?? []), cardVariant]);
  }

  return [...groups.entries()]
    .map(([key, groupedVariants]) =>
      createCard(key, groupedVariants, picturesByVariant, commonPictures),
    )
    .sort((left, right) =>
      (left.color ?? "").localeCompare(right.color ?? "", "es", {
        sensitivity: "base",
      }),
    );
}

export function createSimilarPublicationVariantSummary(
  cards: readonly SimilarPublicationVariantCard[],
  commonPictures: readonly SimilarPublicationPicture[],
): SimilarPublicationVariantSummary {
  const pictureIds = new Set(commonPictures.map(({ id }) => id));
  let variants = 0;
  let units = 0;

  for (const card of cards) {
    variants += card.variants.length;
    card.pictures.forEach(({ picture }) => pictureIds.add(picture.id));
    card.variants.forEach((variant) => {
      if (variant.stock !== null) units += variant.stock;
    });
  }

  return {
    colors: cards.filter(({ color }) => color !== null).length,
    variants,
    pictures: pictureIds.size,
    units,
  };
}

function createCardVariant(
  variant: SimilarPublicationVariant,
  values: Pick<SimilarPublicationFormValues, "attributes" | "variants"> | undefined,
): SimilarPublicationCardVariant {
  const edited = values?.variants[variant.sourceReference];
  return {
    sourceReference: variant.sourceReference,
    variant,
    color: readAttribute(variant, values, "COLOR"),
    size: readAttribute(variant, values, "SIZE"),
    stock: edited?.stock ?? variant.stock,
    sku: edited?.sku ?? "",
    price: edited?.price ?? variant.price,
  };
}

function cardVariantColorKey(variant: SimilarPublicationCardVariant): string {
  const { color } = variant;
  return color
    ? `color:${color.trim().toLocaleLowerCase("es-AR")}`
    : `variant:${variant.sourceReference}`;
}

function createCard(
  key: string,
  variants: readonly SimilarPublicationCardVariant[],
  picturesByVariant: VariantPictures,
  commonPictures: readonly SimilarPublicationPicture[],
): SimilarPublicationVariantCard {
  const color = variants[0]?.color ?? null;
  const pictures = uniquePictures(
    variants.flatMap((variant) =>
      (picturesByVariant[variant.sourceReference] ?? []).map((picture) => ({
        key: `${variant.sourceReference}:${picture.id}`,
        sourceReference: variant.sourceReference,
        picture,
      })),
    ),
  );
  const stockTotal = variants.every(({ stock }) => stock !== null)
    ? variants.reduce((total, variant) => total + (variant.stock ?? 0), 0)
    : null;
  const requiresSize = variants.some(({ variant }) =>
    hasAttribute(variant, "SIZE"),
  );
  const hasEverySize = !requiresSize || variants.every(({ size }) => Boolean(size));
  const hasEverySku = variants.every(({ sku }) => Boolean(sku.trim()));
  const hasApplicablePictures = commonPictures.length > 0 || pictures.length > 0;

  return {
    key,
    color,
    pictures,
    variants,
    stockTotal,
    complete:
      Boolean(color) &&
      hasEverySize &&
      hasEverySku &&
      variants.every(({ stock }) => stock !== null) &&
      hasApplicablePictures,
    commonPicturesCount: commonPictures.length,
  };
}

function readAttribute(
  variant: SimilarPublicationVariant | undefined,
  values: Pick<SimilarPublicationFormValues, "attributes"> | undefined,
  attributeId: "COLOR" | "SIZE",
): string | null {
  if (!variant) return null;
  const attribute = variant.attributes.find(
    ({ id }) => id.trim().toUpperCase() === attributeId,
  );
  if (!attribute) return null;
  const edited = values?.attributes[variant.sourceReference]?.[attribute.id];
  const value = edited === undefined ? attribute.valueName : edited;
  return value?.trim() || null;
}

function hasAttribute(
  variant: SimilarPublicationVariant,
  attributeId: "COLOR" | "SIZE",
): boolean {
  return variant.attributes.some(
    ({ id }) => id.trim().toUpperCase() === attributeId,
  );
}

function uniquePictures(
  pictures: readonly SimilarPublicationVariantPicture[],
): readonly SimilarPublicationVariantPicture[] {
  const seen = new Set<string>();
  return pictures.filter(({ picture }) => {
    if (seen.has(picture.id)) return false;
    seen.add(picture.id);
    return true;
  });
}
