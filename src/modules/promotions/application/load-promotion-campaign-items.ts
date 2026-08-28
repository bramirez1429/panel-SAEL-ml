import type { PromotionCampaignItems } from "../domain/promotion-campaign-items.model";
import type {
  PromotionCampaignItemsRequest,
  PromotionsRepository,
} from "../domain/promotions.repository";

export type CampaignItemsLoadResult =
  | Readonly<{ success: true; page: PromotionCampaignItems }>
  | Readonly<{ success: false; error: unknown }>;

export async function loadPromotionCampaignItems(
  repository: Pick<PromotionsRepository, "getCampaignItems">,
  request: PromotionCampaignItemsRequest,
): Promise<CampaignItemsLoadResult> {
  try {
    return { success: true, page: await repository.getCampaignItems(request) };
  } catch (error) {
    return { success: false, error };
  }
}
