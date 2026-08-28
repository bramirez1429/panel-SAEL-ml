import type { PromotionCampaigns } from "../domain/promotion-campaign.model";
import { createPromotionsRepository } from "../promotions.composition.server";
import { PromotionCampaignsError } from "./promotion-campaigns-error";
import { PromotionsView } from "./promotions-view";

export async function PromotionCampaignsSection() {
  let campaigns: PromotionCampaigns | null = null;
  try {
    campaigns = await createPromotionsRepository().getCampaigns();
  } catch {}
  if (!campaigns) return <PromotionCampaignsError />;
  return <PromotionsView campaigns={campaigns.campaigns} />;
}
