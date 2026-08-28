import type { PromotionCampaign } from "../domain/promotion-campaign.model";
import { loadPromotionCampaignItems } from "../application/load-promotion-campaign-items";
import type { PromotionCampaignItemsPagingRequest } from "../domain/promotion-campaign-items.model";
import { createPromotionsRepository } from "../promotions.composition.server";
import { PromotionCampaignItemsError } from "./promotion-campaign-items-error";
import { PromotionCampaignItemsTable } from "./promotion-campaign-items-table.client";

type Props = Readonly<{
  campaign: PromotionCampaign;
  paging: PromotionCampaignItemsPagingRequest;
}>;

export async function PromotionCampaignItemsSection({ campaign, paging }: Props) {
  const result = await loadPromotionCampaignItems(createPromotionsRepository(), {
    promotionId: campaign.id,
    promotionType: campaign.type,
    paging,
  });
  if (!result.success) {
    return <PromotionCampaignItemsError />;
  }
  return <PromotionCampaignItemsTable promotionId={campaign.id} page={result.page} />;
}
