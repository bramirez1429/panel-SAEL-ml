"use client";

import { Select, Space } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import type { PromotionCampaign } from "../domain/promotion-campaign.model";

type Props = Readonly<{
  campaigns: readonly PromotionCampaign[];
  children?: ReactNode;
}>;

export function PromotionsView({ campaigns, children }: Props) {
  const router = useRouter();
  const current = useSearchParams();
  const selectedPromotionId = campaigns.some((campaign) => campaign.id === current.get("promotionId"))
    ? current.get("promotionId") ?? undefined
    : undefined;
  const selectCampaign = (promotionId: string) => {
    const params = new URLSearchParams();
    if (promotionId) params.set("promotionId", promotionId);
    router.push(`/promociones?${params}`);
  };

  return <div className="promotions-layout">
    <Space wrap aria-label="Filtros de promociones">
      <Select
        aria-label="Promoción"
        placeholder="Seleccionar promoción"
        options={campaigns.map((campaign) => ({
          value: campaign.id,
          label: campaign.name ?? "Promoción de Mercado Libre",
        }))}
        value={selectedPromotionId}
        onChange={selectCampaign}
      />
    </Space>
    {campaigns.length === 0 ? <p>No hay promociones disponibles actualmente.</p> : null}
    {children}
  </div>;
}
