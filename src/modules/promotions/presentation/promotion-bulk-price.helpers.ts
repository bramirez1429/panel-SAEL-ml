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

type PromotionOptionLike = Readonly<{
  type: string | null;
  status: string | null;
  subType?: string | null;
  canApply: boolean;
  canRemove: boolean;
  canUpdatePrice?: boolean | null;
  canEditPrice?: boolean | null;
  priceEditabilityReason?: string | null;
  priceModification?: Readonly<{
    operation: string;
    allowed: boolean;
    reason: string | null;
  }> | null;
  promotionPrice: number | null;
  requiresPriceSelection: boolean | null;
  minPromotionPrice: number | null;
  maxPromotionPrice: number | null;
  suggestedPromotionPrice: number | null;
}>;

export type PromotionLifecycle = "new" | "active" | "scheduled" | "unknown";

export function promotionLifecycle(
  option: Pick<PromotionOptionLike, "status" | "canRemove" | "canUpdatePrice" | "priceModification" | "promotionPrice">,
): PromotionLifecycle {
  const status = option.status?.toLowerCase();
  const operation = normalizeOperation(option.priceModification?.operation);

  if (status === "started" || status === "active") return "active";
  if (status === "pending" || status === "scheduled") return "scheduled";
  if (option.canUpdatePrice !== null && option.canUpdatePrice !== undefined && positivePrice(option.promotionPrice)) {
    return "active";
  }
  if (status === "candidate" && operation !== "UPDATE" && !option.canRemove) return "new";
  if (operation === "UPDATE" || option.canRemove || positivePrice(option.promotionPrice)) return "active";
  if (status === "candidate") return "new";
  return "unknown";
}

export function isExistingPromotion(
  option: Pick<PromotionOptionLike, "status" | "canRemove" | "canUpdatePrice" | "priceModification" | "promotionPrice">,
): boolean {
  const lifecycle = promotionLifecycle(option);
  return lifecycle === "active" || lifecycle === "scheduled";
}

export function canEditPromotionPrice(
  option: Pick<PromotionOptionLike, "type" | "status" | "subType" | "canApply" | "canRemove" | "canUpdatePrice" | "canEditPrice" | "priceEditabilityReason" | "priceModification" | "promotionPrice" | "requiresPriceSelection" | "minPromotionPrice" | "maxPromotionPrice" | "suggestedPromotionPrice">,
): boolean {
  const type = option.type?.toUpperCase();
  const lifecycle = promotionLifecycle(option);
  if (type !== "PRICE_DISCOUNT" && type !== "DEAL" && type !== "SELLER_CAMPAIGN") return false;
  if (type === "SELLER_CAMPAIGN" && option.subType?.toUpperCase() !== "FLEXIBLE_PERCENTAGE") return false;
  if (lifecycle === "new") {
    if (option.canApply !== true || !isCreateOperation(option)) return false;
    if (option.priceModification || option.canEditPrice === true) return true;
    if (option.requiresPriceSelection !== true) return false;
    return option.requiresPriceSelection === true
      || option.minPromotionPrice !== null
      || option.maxPromotionPrice !== null
      || (option.suggestedPromotionPrice !== null && option.suggestedPromotionPrice > 0);
  }

  if (lifecycle !== "active" && lifecycle !== "scheduled") return false;
  return option.canUpdatePrice === true;
}

export function promotionPriceEditabilityReason(
  option: Pick<PromotionOptionLike, "type" | "status" | "subType" | "canApply" | "canRemove" | "canUpdatePrice" | "canEditPrice" | "priceEditabilityReason" | "priceModification" | "promotionPrice" | "requiresPriceSelection">,
): string | null {
  if (canEditPromotionPrice({
    ...option,
    minPromotionPrice: null,
    maxPromotionPrice: null,
    suggestedPromotionPrice: null,
  })) return null;

  const explicitReason = option.priceModification?.reason ?? option.priceEditabilityReason;
  if (explicitReason?.trim()) return explicitReason;
  if (option.canUpdatePrice === false) {
    return "Mercado Libre no permite modificar el precio de esta participación.";
  }
  if (option.type?.toUpperCase() === "SELLER_CAMPAIGN" && option.subType?.toUpperCase() !== "FLEXIBLE_PERCENTAGE") {
    return "Sólo las campañas SELLER_CAMPAIGN de subtipo FLEXIBLE_PERCENTAGE permiten modificar el precio por publicación.";
  }
  if (promotionLifecycle(option) === "active" || promotionLifecycle(option) === "scheduled") {
    return "No pudimos verificar si se puede modificar.";
  }
  if (option.status?.toLowerCase() === "candidate" && option.canApply !== true) {
    return "Mercado Libre no permite participar en esta promoción.";
  }
  return "La capacidad de modificación de esta promoción no está disponible.";
}

export function promotionOperation(
  option: Pick<PromotionOptionLike, "status" | "canRemove" | "canUpdatePrice" | "priceModification" | "promotionPrice" | "canApply">,
): "CREATE" | "UPDATE" | "NONE" | "UNKNOWN" {
  const explicit = normalizeOperation(option.priceModification?.operation);
  if (explicit !== "UNKNOWN") return explicit;
  const lifecycle = promotionLifecycle(option);
  if (lifecycle === "new" && option.canApply) return "CREATE";
  if (lifecycle === "active" || lifecycle === "scheduled") return "UPDATE";
  return "UNKNOWN";
}

export function isActivePromotion(
  option: Pick<PromotionOptionLike, "status" | "canRemove" | "canUpdatePrice" | "priceModification" | "promotionPrice">,
): boolean {
  return promotionLifecycle(option) === "active";
}

export function hasPendingPromotionOperation(
  selection: SelectedPromotion,
  price: number | null,
): boolean {
  const operation = promotionOperation(selection.option);
  if (operation === "CREATE") return validSelectionPrice(selection, price);
  if (operation !== "UPDATE" || !canEditPromotionPrice(selection.option)) return false;
  return validSelectionPrice(selection, price)
    && price !== null
    && price !== selection.option.promotionPrice;
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
      ownPromotionPrice(selection) ?? suggestedPrice(selection) ?? validMaxPrice(selection),
    ]),
  );
}

export function initialCampaignPriceExclusions(
  selections: readonly SelectedPromotion[],
): CampaignPriceExclusions {
  return Object.fromEntries(selections.map((selection) => [selection.key, false]));
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
    if (excludedFromCampaign[selection.key]) continue;
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
      price: suggestedPrice(selection) ?? ownPromotionPrice(selection) ?? currentPrice,
      invalidCampaignPrice: null,
    };
  }
  if (campaignPrice !== null && validSelectionPrice(selection, campaignPrice)) {
    return { price: campaignPrice, invalidCampaignPrice: null };
  }
  return { price: currentPrice, invalidCampaignPrice: campaignPrice };
}

export function summarizeCampaignPrice(
  selections: readonly SelectedPromotion[],
  excludedFromCampaign: CampaignPriceExclusions,
  campaignPrice: number | null,
): CampaignPriceSummary {
  const editable = selections.filter((selection) => canEditPromotionPrice(selection.option));
  const included = editable.filter((selection) => excludedFromCampaign[selection.key] !== true);
  return {
    eligibleCount: editable.length,
    excludedCount: editable.length - included.length,
    appliedCount: included.filter((selection) => validCampaignPrice(selection, campaignPrice)).length,
    rejectedCount: included.filter((selection) => !validCampaignPrice(selection, campaignPrice)).length,
  };
}

export function commonPromotionPriceRange(
  selections: readonly SelectedPromotion[],
): CommonPriceRange | null {
  const editable = selections.filter((selection) => canEditPromotionPrice(selection.option));
  if (editable.length === 0) return null;
  const minimums = editable.map((selection) => selection.option.minPromotionPrice).filter((value): value is number => value !== null);
  const maximums = editable.map((selection) => selection.option.maxPromotionPrice).filter((value): value is number => value !== null);
  const minimum = minimums.length > 0 ? Math.max(...minimums) : null;
  const maximum = maximums.length > 0 ? Math.min(...maximums) : null;
  return { minimum, maximum, hasIntersection: minimum === null || maximum === null || minimum <= maximum };
}

export function suggestedPrice(selection: SelectedPromotion): number | null {
  const price = selection.option.suggestedPromotionPrice;
  return validSelectionPrice(selection, price) ? price : null;
}

function ownPromotionPrice(selection: SelectedPromotion): number | null {
  const price = selection.option.promotionPrice;
  return positivePrice(price) ? price : null;
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
  if (campaignPrice === null || !Number.isFinite(campaignPrice) || campaignPrice <= 0) return null;
  const discounts = selections
    .filter((selection) => excludedFromCampaign[selection.key] !== true && canEditPromotionPrice(selection.option))
    .map((selection) => promotionDiscountPercent(selection.option.originalPrice, campaignPrice))
    .filter((value): value is number => value !== null);
  if (discounts.length === 0) return null;
  return { minimum: Math.min(...discounts), maximum: Math.max(...discounts) };
}

export function validSelectionPrice(selection: SelectedPromotion, price: number | null): boolean {
  if (!canEditPromotionPrice(selection.option)) {
    return promotionOperation(selection.option) === "CREATE";
  }
  if (price === null || !Number.isFinite(price) || price <= 0) return false;
  if (selection.option.minPromotionPrice !== null && price < selection.option.minPromotionPrice) return false;
  return selection.option.maxPromotionPrice === null || price <= selection.option.maxPromotionPrice;
}

function validCampaignPrice(selection: SelectedPromotion, price: number | null): boolean {
  if (!canEditPromotionPrice(selection.option)) return false;
  if (price === null || !Number.isFinite(price) || price <= 0) return false;
  if (selection.option.minPromotionPrice !== null && price < selection.option.minPromotionPrice) return false;
  return selection.option.maxPromotionPrice === null || price <= selection.option.maxPromotionPrice;
}

function isCreateOperation(option: Pick<PromotionOptionLike, "priceModification" | "canApply">): boolean {
  const explicit = normalizeOperation(option.priceModification?.operation);
  if (explicit === "NONE") return false;
  if (explicit === "UNKNOWN") return option.priceModification === null || option.priceModification === undefined;
  return explicit === "CREATE" || option.priceModification === null || option.priceModification === undefined;
}

function normalizeOperation(operation: string | null | undefined): "CREATE" | "UPDATE" | "NONE" | "UNKNOWN" {
  const normalized = operation?.toUpperCase();
  if (normalized === "CREATE" || normalized === "UPDATE" || normalized === "NONE") return normalized;
  return "UNKNOWN";
}

function positivePrice(value: number | null): boolean {
  return value !== null && Number.isFinite(value) && value > 0;
}

export function promotionDiscountPercent(originalPrice: number | null, selectedPrice: number | null): number | null {
  if (originalPrice === null || selectedPrice === null || !Number.isFinite(originalPrice) || !Number.isFinite(selectedPrice) || originalPrice <= 0) return null;
  return ((originalPrice - selectedPrice) / originalPrice) * 100;
}

export function promotionName(selection: SelectedPromotion): string {
  return selection.option.name ?? "Promoción de Mercado Libre";
}

const percentFormatter = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2, minimumFractionDigits: 0 });

export function money(value: number | null): string {
  if (value === null) return "—";
  const hasDecimals = !Number.isInteger(value);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function percentage(value: number | null): string {
  return value === null ? "—" : `${percentFormatter.format(value)} %`;
}
