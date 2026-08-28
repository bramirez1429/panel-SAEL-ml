import { loadPromotionCampaigns } from "../application/load-promotion-campaigns";
import { createPromotionsRepository } from "../promotions.composition.server";
import { PromotionCampaignsError } from "./promotion-campaigns-error";
import { PromotionsView } from "./promotions-view";

export async function PromotionCampaignsSection() {
  const result = await loadPromotionCampaigns(createPromotionsRepository());
  if (!result.success) return <PromotionCampaignsError />;
  return <PromotionsView campaigns={result.campaigns.campaigns} />;
}
