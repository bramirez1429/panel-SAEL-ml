import type {
  PublicationDetail,
  PublicationPicture,
  PublicationVariant,
} from "../domain/publication.model";
import { getAttributeValue } from "./publication-variant-row";

export type PublicationVariantVisualOffer = Readonly<{
  key: string;
  itemId: string | null;
  userProductId: string | null;
  size: string | null;
  stock: number | null;
  sku: string | null;
  price: PublicationVariant["price"];
  status: string | null;
}>;

export type PublicationVariantCardModel = Readonly<{
  key: string;
  color: string | null;
  pictures: readonly PublicationPicture[];
  offers: readonly PublicationVariantVisualOffer[];
  statuses: readonly (string | null)[];
  stockTotal: number | null;
  skus: readonly string[];
  priceRange: Readonly<{
    min: number;
    max: number;
    currency: string | null;
  }> | null;
  complete: boolean;
}>;

export type PublicationVariantSummaryModel = Readonly<{
  colors: number;
  variants: number;
  images: number;
  units: number;
}>;

type VisualSource = Readonly<{
  key: string;
  itemId: string | null;
  userProductId: string | null;
  color: string | null;
  size: string | null;
  pictures: readonly PublicationPicture[];
  stock: number | null;
  sku: string | null;
  price: PublicationVariant["price"];
  status: string | null;
}>;

export function createPublicationVariantCards(
  publication: PublicationDetail,
): readonly PublicationVariantCardModel[] {
  const groups = new Map<string, VisualSource[]>();
  for (const source of createVisualSources(publication)) {
    const key = source.color
      ? `color:${normalize(source.color)}`
      : `variant:${source.userProductId ?? source.itemId ?? source.key}`;
    groups.set(key, [...(groups.get(key) ?? []), source]);
  }

  return [...groups.entries()]
    .map(([key, sources]) => createCard(key, sources))
    .sort((left, right) =>
      (left.color ?? "").localeCompare(right.color ?? "", "es", {
        sensitivity: "base",
      }),
    );
}

export function createPublicationVariantSummary(
  cards: readonly PublicationVariantCardModel[],
): PublicationVariantSummaryModel {
  const pictures = new Set<string>();
  let variants = 0;
  let units = 0;
  for (const card of cards) {
    variants += card.offers.length;
    card.pictures.forEach((picture) => pictures.add(`${picture.id}:${picture.url}`));
    card.offers.forEach((offer) => {
      if (offer.stock !== null) units += offer.stock;
    });
  }
  return {
    colors: cards.filter(({ color }) => color !== null).length,
    variants,
    images: pictures.size,
    units,
  };
}

function createVisualSources(publication: PublicationDetail): readonly VisualSource[] {
  if (publication.variants.length > 0) {
    return publication.variants.map((variant) => ({
      key: variant.id,
      itemId: variant.itemId,
      userProductId: variant.userProductId,
      color:
        getAttributeValue(variant.attributes, "COLOR") ?? variant.label?.trim() ?? null,
      size: getAttributeValue(variant.attributes, "SIZE"),
      pictures: variant.pictures ?? [],
      stock: variant.stock,
      sku: variant.sku,
      price: variant.price,
      status: variant.status,
    }));
  }

  return [
    {
      key: publication.id,
      itemId: publication.group.itemId ?? publication.id,
      userProductId: publication.group.userProductId,
      color: getAttributeValue(publication.attributes, "COLOR"),
      size: getAttributeValue(publication.attributes, "SIZE"),
      pictures: publication.pictures ?? [],
      stock: publication.stock,
      sku: getAttributeValue(publication.attributes, "SELLER_SKU"),
      price: publicationPrice(publication),
      status: publication.status,
    },
  ];
}

function createCard(
  key: string,
  sources: readonly VisualSource[],
): PublicationVariantCardModel {
  const pictures = uniquePictures(sources.flatMap((source) => source.pictures));
  const skus = uniqueStrings(sources.flatMap((source) => (source.sku ? [source.sku] : [])));
  const statuses = uniqueNullable(sources.map((source) => source.status));
  const allStocksKnown = sources.every((source) => source.stock !== null);
  const color = sources[0]?.color ?? null;
  return {
    key,
    color,
    pictures,
    offers: sources.map(({ key: offerKey, itemId, userProductId, size, stock, sku, price, status }) => ({
      key: offerKey,
      itemId,
      userProductId,
      size,
      stock,
      sku,
      price,
      status,
    })),
    statuses,
    stockTotal: allStocksKnown
      ? sources.reduce((total, source) => total + (source.stock ?? 0), 0)
      : null,
    skus,
    priceRange: createPriceRange(sources),
    complete:
      Boolean(color) &&
      pictures.length > 0 &&
      sources.every((source) => Boolean(source.sku) && source.stock !== null),
  };
}

function createPriceRange(sources: readonly VisualSource[]): PublicationVariantCardModel["priceRange"] {
  const prices = sources.flatMap((source) =>
    source.price ? [source.price] : [],
  );
  if (prices.length === 0) return null;
  const amounts = prices.map(({ amount }) => amount);
  const currencies = uniqueStrings(
    prices.flatMap(({ currency }) => (currency ? [currency] : [])),
  );
  return {
    min: Math.min(...amounts),
    max: Math.max(...amounts),
    currency: currencies.length === 1 ? currencies[0] ?? null : null,
  };
}

function publicationPrice(publication: PublicationDetail): PublicationVariant["price"] {
  const amount = publication.price?.from ?? publication.price?.to ?? null;
  return amount === null
    ? null
    : { amount, currency: publication.price?.currency ?? null };
}

function uniquePictures(
  pictures: readonly PublicationPicture[],
): readonly PublicationPicture[] {
  return [...new Map(pictures.map((picture) => [picture.id, picture])).values()];
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function uniqueNullable(
  values: readonly (string | null)[],
): readonly (string | null)[] {
  return [...new Set(values)];
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("es-AR");
}
