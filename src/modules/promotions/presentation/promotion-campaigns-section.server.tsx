import { loadPromotionCampaigns } from "../application/load-promotion-campaigns";
import { logPromotionCampaignsFailure } from "../application/log-promotion-campaigns-failure.server";
import { createPromotionsRepository } from "../promotions.composition.server";
import { PromotionCampaignsError } from "./promotion-campaigns-error";
import { PromotionsView } from "./promotions-view";

export async function PromotionCampaignsSection() {
  const result = await loadPromotionCampaigns(createPromotionsRepository());
  if (!result.success) {
    logPromotionCampaignsFailure(result.error);
    return <PromotionCampaignsError />;
  }
  return <PromotionsView campaigns={result.campaigns.campaigns} />;
}
