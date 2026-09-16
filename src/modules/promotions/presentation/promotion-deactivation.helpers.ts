import type { PromotionOption } from "../domain/promotions.repository";
import { promotionOptionToRemovalSelection } from "../domain/promotion-removal.mapper";

export function isRemovablePromotionOption(option: PromotionOption): boolean {
  return (
    (option.status === "started" || option.status === "pending")
    && option.canRemove
    && promotionOptionToRemovalSelection(option) !== null
  );
}

export function promotionDeactivationKey(
  itemId: string,
  option: Pick<PromotionOption, "type" | "id" | "offerId">,
): string {
  return [itemId, option.type ?? "", option.id ?? "", option.offerId ?? ""].join("::");
}
