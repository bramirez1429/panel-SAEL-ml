"use client";

import { Select, Space } from "antd";
import { useRouter, useSearchParams } from "next/navigation";

import type { PromotionCampaign } from "../domain/promotion-campaign.model";

type Props = Readonly<{
  campaigns: readonly PromotionCampaign[];
  children?: React.ReactNode;
}>;

const audiences = [
  { label: "Todos", value: "" },
  { label: "Mujer", value: "WOMEN" },
  { label: "Niña", value: "GIRLS" },
] as const;

export function PromotionsView({ campaigns, children }: Props) {
  const router = useRouter();
  const current = useSearchParams();
  const currentPromotionId = current.get("promotionId");
  const selectedPromotionId = campaigns.some((campaign) => campaign.id === currentPromotionId)
    ? currentPromotionId
    : undefined;
  const navigate = (update: Readonly<{ promotionId?: string; audience?: string }>) => {
    const params = new URLSearchParams(current);
    if (update.promotionId !== undefined) {
      if (update.promotionId) params.set("promotionId", update.promotionId);
      else params.delete("promotionId");
    }
    if (update.audience !== undefined) {
      if (update.audience) params.set("audience", update.audience);
      else params.delete("audience");
    }
    params.delete("cursor");
    router.push(`/promociones?${params}`);
  };

  return <div className="promotions-layout">
    <Space wrap aria-label="Filtros de promociones">
      <Select
        aria-label="Promoción"
        placeholder="Seleccionar promoción"
        options={campaigns.map((campaign) => ({
          value: campaign.id,
          label: <span>{campaign.name} · {campaign.eligibleItems} publicaciones elegibles</span>,
        }))}
        value={selectedPromotionId}
        onChange={(promotionId: string) => navigate({ promotionId })}
      />
      <Select
        aria-label="Público"
        options={[...audiences]}
        value={current.get("audience") ?? ""}
        onChange={(audience: string) => navigate({ audience })}
      />
    </Space>
    {campaigns.length === 0 ? <p>No hay promociones disponibles actualmente.</p> : null}
    {children}
  </div>;
}
