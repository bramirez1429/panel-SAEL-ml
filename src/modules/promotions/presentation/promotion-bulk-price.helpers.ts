import type { SelectedPromotion } from "./promotion-global.store";

export type PromotionPrices = Readonly<Record<string, number | null>>;
export type CampaignPrices = Readonly<Record<string, number | null>>;
export type CampaignPriceExclusions = Readonly<Record<string, boolean>>;
export type CampaignPriceWarnings = Readonly<Record<string, number>>;
export type CampaignPriceSummary = Readonly<{
  eligibleCount: number;
  appliedCount: number;
  excludedCount: number;
  rejectedCount: number;
}>;

export type CommonPriceRange = Readonly<{
  minimum: number | null;
  maximum: number | null;
  hasIntersection: boolean;
}>;

export function initialPromotionPrices(
  selections: readonly SelectedPromotion[],
): PromotionPrices {
  return Object.fromEntries(
    selections.map((selection) => [selection.key, suggestedPrice(selection)]),
  );
}

export function promotionCampaignKey(selection: SelectedPromotion): string {
  const { option } = selection;
  const identifier = option.id ?? option.offerId ?? option.name ?? "unknown";
  return `${option.type ?? ""}::${identifier}`;
}

export function applyCampaignPrice(
  selections: readonly SelectedPromotion[],
  currentPrices: PromotionPrices,
  excludedFromCampaign: CampaignPriceExclusions,
  campaignPrice: number | null,
): Readonly<{ prices: PromotionPrices; warnings: CampaignPriceWarnings }> {
  const prices = { ...currentPrices };
  const warnings: Record<string, number> = {};

  if (campaignPrice === null || !Number.isFinite(campaignPrice) || campaignPrice <= 0) {
    return { prices, warnings };
  }

  for (const selection of selections) {
    if (
      selection.option.requiresPriceSelection !== true
      || excludedFromCampaign[selection.key]
    ) {
      continue;
    }

    if (validSelectionPrice(selection, campaignPrice)) {
      prices[selection.key] = campaignPrice;
    } else {
      warnings[selection.key] = campaignPrice;
    }
  }

  return { prices, warnings };
}

export function priceForCampaignExclusion(
  selection: SelectedPromotion,
  excludedFromCampaign: boolean,
  campaignPrice: number | null,
  currentPrice: number | null,
): Readonly<{ price: number | null; invalidCampaignPrice: number | null }> {
  if (excludedFromCampaign) {
    return {
      price: suggestedPrice(selection) ?? validOwnPrice(selection) ?? currentPrice,
      invalidCampaignPrice: null,
    };
  }

  if (campaignPrice !== null && validSelectionPrice(selection, campaignPrice)) {
    return { price: campaignPrice, invalidCampaignPrice: null };
  }

  return {
    price: currentPrice,
    invalidCampaignPrice: campaignPrice,
  };
}

export function summarizeCampaignPrice(
  selections: readonly SelectedPromotion[],
  excludedFromCampaign: CampaignPriceExclusions,
  campaignPrice: number | null,
): CampaignPriceSummary {
  const editable = selections.filter(
    (selection) => selection.option.requiresPriceSelection === true,
  );
  const included = editable.filter(
    (selection) => excludedFromCampaign[selection.key] !== true,
  );

  return {
    eligibleCount: editable.length,
    excludedCount: editable.length - included.length,
    appliedCount: included.filter((selection) => (
      validSelectionPrice(selection, campaignPrice)
    )).length,
    rejectedCount: included.filter((selection) => (
      !validSelectionPrice(selection, campaignPrice)
    )).length,
  };
}

export function commonPromotionPriceRange(
  selections: readonly SelectedPromotion[],
): CommonPriceRange | null {
  const editable = selections.filter(
    (selection) => selection.option.requiresPriceSelection === true,
  );
  if (editable.length === 0) return null;

  const minimums = editable
    .map((selection) => selection.option.minPromotionPrice)
    .filter((value): value is number => value !== null);
  const maximums = editable
    .map((selection) => selection.option.maxPromotionPrice)
    .filter((value): value is number => value !== null);
  const minimum = minimums.length > 0 ? Math.max(...minimums) : null;
  const maximum = maximums.length > 0 ? Math.min(...maximums) : null;

  return {
    minimum,
    maximum,
    hasIntersection: minimum === null || maximum === null || minimum <= maximum,
  };
}

export function suggestedPrice(selection: SelectedPromotion): number | null {
  const price = selection.option.suggestedPromotionPrice;
  return validSelectionPrice(selection, price) ? price : null;
}

function validOwnPrice(selection: SelectedPromotion): number | null {
  const price = selection.option.promotionPrice;
  return validSelectionPrice(selection, price) ? price : null;
}

export function campaignDiscountRange(
  selections: readonly SelectedPromotion[],
  excludedFromCampaign: CampaignPriceExclusions,
  campaignPrice: number | null,
): Readonly<{ minimum: number; maximum: number }> | null {
  if (campaignPrice === null || !Number.isFinite(campaignPrice) || campaignPrice <= 0) {
    return null;
  }

  const discounts = selections
    .filter((selection) => (
      selection.option.requiresPriceSelection === true
      && excludedFromCampaign[selection.key] !== true
    ))
    .map((selection) => promotionDiscountPercent(selection.option.originalPrice, campaignPrice))
    .filter((value): value is number => value !== null);

  if (discounts.length === 0) return null;
  return { minimum: Math.min(...discounts), maximum: Math.max(...discounts) };
}

export function validSelectionPrice(
  selection: SelectedPromotion,
  price: number | null,
): boolean {
  if (selection.option.requiresPriceSelection !== true) {
    return selection.option.promotionPrice !== null && selection.option.promotionPrice > 0;
  }
  if (price === null || !Number.isFinite(price) || price <= 0) return false;
  if (
    selection.option.minPromotionPrice !== null
    && price < selection.option.minPromotionPrice
  ) return false;
  return selection.option.maxPromotionPrice === null
    || price <= selection.option.maxPromotionPrice;
}

export function promotionDiscountPercent(
  originalPrice: number | null,
  selectedPrice: number | null,
): number | null {
  if (
    originalPrice === null
    || selectedPrice === null
    || !Number.isFinite(originalPrice)
    || !Number.isFinite(selectedPrice)
    || originalPrice <= 0
  ) return null;

  return ((originalPrice - selectedPrice) / originalPrice) * 100;
}

export function promotionName(selection: SelectedPromotion): string {
  return selection.option.name ?? "Promoción de Mercado Libre";
}

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function money(value: number | null): string {
  return value === null ? "—" : moneyFormatter.format(value);
}

export function percentage(value: number | null): string {
  return value === null ? "—" : `${percentFormatter.format(value)} %`;
}
