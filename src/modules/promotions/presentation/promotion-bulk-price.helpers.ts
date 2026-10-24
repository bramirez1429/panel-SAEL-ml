import type { SelectedPromotion } from "./promotion-global.store";

export type PromotionPrices = Readonly<Record<string, number | null>>;
export type CampaignPrices = Readonly<Record<string, number | null>>;
export type CampaignPriceExclusions = Readonly<Record<string, boolean>>;
export type CampaignPriceWarnings = Readonly<Record<string, number>>;
export type CampaignPriceSummary = Readonly<{ eligibleCount: number; appliedCount: number; excludedCount: number; rejectedCount: number }>;

type PromotionOptionLike = Readonly<{
  type: string | null;
  status: string | null;
  canApply: boolean;
  promotionSubtype?: string | null;
  canUpdatePrice?: boolean;
  priceUpdateRestriction?: string | null;
  promotionPrice: number | null;
  currentEditablePrice?: number | null;
  minUpdatePrice?: number | null;
  maxUpdatePrice?: number | null;
  requiresPriceSelection: boolean | null;
  minPromotionPrice: number | null;
  maxPromotionPrice: number | null;
  suggestedPromotionPrice: number | null;
}>;

export function isExistingPromotion(option: Pick<PromotionOptionLike, "status">): boolean {
  return option.status === "started" || option.status === "pending";
}

export function canEditPromotionPrice(option: PromotionOptionLike): boolean {
  const type = option.type?.toUpperCase();
  if (isExistingPromotion(option)) {
    return option.canUpdatePrice === true
      && (type === "DEAL" || (type === "SELLER_CAMPAIGN" && option.promotionSubtype === "FLEXIBLE_PERCENTAGE"));
  }
  if (option.status !== "candidate" || !option.canApply) return false;
  if (type === "DEAL") return true;
  if (type === "SELLER_CAMPAIGN") {
    return option.promotionSubtype === "FLEXIBLE_PERCENTAGE" && option.requiresPriceSelection === true;
  }
  if (type !== "PRICE_DISCOUNT") return false;
  return option.requiresPriceSelection === true;
}

export function promotionEditabilityReason(option: PromotionOptionLike): string {
  if (option.priceUpdateRestriction) return option.priceUpdateRestriction;
  if (isExistingPromotion(option)) return "Esta promoción no permite modificar el precio directamente.";
  return "Mercado Libre no ofrece un precio editable para esta propuesta.";
}

export function hasPendingPromotionOperation(selection: SelectedPromotion, price: number | null): boolean {
  if (isExistingPromotion(selection.option)) {
    const existing = selection.option.currentEditablePrice ?? selection.option.promotionPrice;
    return canEditPromotionPrice(selection.option) && validSelectionPrice(selection, price)
      && existing !== null && price !== null
      && Math.round(price * 100) !== Math.round(existing * 100);
  }
  return selection.option.status === "candidate" && selection.option.canApply && validSelectionPrice(selection, price);
}

export type CommonPriceRange = Readonly<{
  minimum: number | null;
  maximum: number | null;
  hasIntersection: boolean;
}>;

export function initialPromotionPrices(
  selections: readonly SelectedPromotion[],
): PromotionPrices {
  return Object.fromEntries(
    selections.map((selection) => [
      selection.key,
      (isExistingPromotion(selection.option) ? selection.option.currentEditablePrice ?? null : null)
        ?? validOwnPrice(selection) ?? suggestedPrice(selection) ?? validMaxPrice(selection),
    ]),
  );
}

export function initialCampaignPriceExclusions(
  selections: readonly SelectedPromotion[],
): CampaignPriceExclusions {
  return Object.fromEntries(
    selections
      .map((selection) => [selection.key, !canEditPromotionPrice(selection.option)]),
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
    if (excludedFromCampaign[selection.key] || !canEditPromotionPrice(selection.option)) continue;

    if (validCampaignPrice(selection, campaignPrice)) {
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
  const editable = selections.filter((selection) => canEditPromotionPrice(selection.option));
  const included = editable.filter(
    (selection) => excludedFromCampaign[selection.key] !== true,
  );

  return {
    eligibleCount: editable.length,
    excludedCount: editable.length - included.length,
    appliedCount: included.filter((selection) => (
      validCampaignPrice(selection, campaignPrice)
    )).length,
    rejectedCount: included.filter((selection) => (
      !validCampaignPrice(selection, campaignPrice)
    )).length,
  };
}

export function commonPromotionPriceRange(
  selections: readonly SelectedPromotion[],
): CommonPriceRange | null {
  const editable = selections.filter(
    (selection) => canEditPromotionPrice(selection.option),
  );
  if (editable.length === 0) return null;

  const minimums = editable
    .map((selection) => isExistingPromotion(selection.option) ? selection.option.minUpdatePrice ?? null : selection.option.minPromotionPrice)
    .filter((value): value is number => value !== null);
  const maximums = editable
    .map((selection) => isExistingPromotion(selection.option) ? selection.option.maxUpdatePrice ?? null : selection.option.maxPromotionPrice)
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

function validMaxPrice(selection: SelectedPromotion): number | null {
  const price = selection.option.maxPromotionPrice;
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
      excludedFromCampaign[selection.key] !== true
    ))
    .map((selection) => promotionDiscountPercent(selection.option.originalPrice, campaignPrice))
    .filter((value): value is number => value !== null);

  if (discounts.length === 0) return null;
  return { minimum: Math.min(...discounts), maximum: Math.max(...discounts) };
}

export function validSelectionPrice(selection: SelectedPromotion, price: number | null): boolean {
  if (!canEditPromotionPrice(selection.option)) {
    return !isExistingPromotion(selection.option) && selection.option.canApply
      && typeof selection.option.promotionPrice === "number" && selection.option.promotionPrice > 0;
  }
  return validCampaignPrice(selection, price);
}

function validCampaignPrice(selection: SelectedPromotion, price: number | null): boolean {
  if (!canEditPromotionPrice(selection.option)) return false;
  if (price === null || !Number.isFinite(price) || price <= 0) return false;
  const option = selection.option;
  const existing = isExistingPromotion(option);
  const min = existing ? option.minUpdatePrice ?? null : option.minPromotionPrice;
  const max = existing ? option.maxUpdatePrice ?? null : option.maxPromotionPrice;
  if (min !== null && price < min) return false;
  if (max !== null && price > max) return false;
  if (existing && option.type === "SELLER_CAMPAIGN" && option.status === "started") {
    const previous = option.currentEditablePrice ?? option.promotionPrice;
    if (previous !== null && price > previous) return false;
  }
  return true;
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
  maximumFractionDigits: 2,
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
