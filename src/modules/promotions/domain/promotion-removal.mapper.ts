import type { PromotionOption } from "./promotions.repository";
import type { PromotionRemovalSelection } from "./promotion-removal.model";

export function promotionOptionToRemovalSelection(
  option: Pick<PromotionOption, "type" | "id" | "offerId">,
): PromotionRemovalSelection | null {
  const promotionId = nonEmpty(option.id);
  const offerId = nonEmpty(option.offerId);

  if (option.type === "PRICE_DISCOUNT") {
    return { promotionType: option.type, promotionId: null, offerId: null };
  }
  if (option.type === "DEAL" || option.type === "SELLER_CAMPAIGN") {
    return promotionId
      ? { promotionType: option.type, promotionId, offerId: null }
      : null;
  }
  if (option.type === "SMART") {
    return promotionId && offerId
      ? { promotionType: option.type, promotionId, offerId }
      : null;
  }
  return null;
}

function nonEmpty(value: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
