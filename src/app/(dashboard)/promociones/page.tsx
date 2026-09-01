import { Suspense } from "react";

import { PromotionCampaignsSkeleton } from "@/modules/promotions/presentation/promotion-campaigns-skeleton";
import { PromotionsCatalog } from "@/modules/promotions/presentation/promotions-catalog.server";

export const dynamic = "force-dynamic";

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default function PromotionsPage({ searchParams }: Props) {
  return <Suspense fallback={<PromotionCampaignsSkeleton />}>
    <PromotionsCatalog searchParams={searchParams} />
  </Suspense>;
}
