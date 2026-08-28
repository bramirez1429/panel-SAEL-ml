import type { PromotionCampaigns } from "../domain/promotion-campaign.model";
import type { PromotionsRepository } from "../domain/promotions.repository";

export type CampaignsLoadResult =
  | Readonly<{ success: true; campaigns: PromotionCampaigns }>
  | Readonly<{ success: false; error: unknown }>;

export async function loadPromotionCampaigns(
  repository: Pick<PromotionsRepository, "getCampaigns">,
): Promise<CampaignsLoadResult> {
  try {
    return { success: true, campaigns: await repository.getCampaigns() };
  } catch (error: unknown) {
    return { success: false, error };
  }
}
