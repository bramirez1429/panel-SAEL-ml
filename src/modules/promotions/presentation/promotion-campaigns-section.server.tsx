import { Suspense } from "react";

import { loadPromotionCampaigns } from "../application/load-promotion-campaigns";
import { logPromotionCampaignsFailure } from "../application/log-promotion-campaigns-failure.server";
import { createPromotionsRepository } from "../promotions.composition.server";
import { PromotionCampaignsError } from "./promotion-campaigns-error";
import { PromotionCampaignItemsSection } from "./promotion-campaign-items-section.server";
import { PromotionCampaignItemsSkeleton } from "./promotion-campaign-items-skeleton";
import { PromotionsView } from "./promotions-view";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const ITEMS_LIMIT = 50;

export async function PromotionCampaignsSection({ searchParams }: Props) {
  const params = await searchParams;
  const result = await loadPromotionCampaigns(createPromotionsRepository());
  if (!result.success) {
    logPromotionCampaignsFailure(result.error);
    return <PromotionCampaignsError />;
  }
  const promotionId = first(params.promotionId);
  const selectedCampaign = result.campaigns.campaigns.find(
    (campaign) => campaign.id === promotionId,
  );

  return <PromotionsView campaigns={result.campaigns.campaigns}>
    {selectedCampaign ? <Suspense fallback={<PromotionCampaignItemsSkeleton />}>
      <PromotionCampaignItemsSection
        campaign={selectedCampaign}
        paging={{ limit: ITEMS_LIMIT, offset: parseOffset(first(params.offset)) }}
      />
    </Suspense> : null}
  </PromotionsView>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseOffset(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) return 0;
  const offset = Number(value);
  return Number.isSafeInteger(offset) ? offset : 0;
}
