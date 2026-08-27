"use client";

import { Input, Select, Space } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import type { PromotionProductGroup, PromotionStatus } from "../domain/promotion.model";

type Props = Readonly<{ children?: React.ReactNode }>;
const products: ReadonlyArray<{ label: string; value: PromotionProductGroup }> = [
  { label: "Remeras Mujer", value: "WOMEN_TSHIRT" },
  { label: "Buzos Mujer", value: "WOMEN_SWEATSHIRT" },
  { label: "Remeras Niña", value: "GIRLS_TSHIRT" },
  { label: "Buzos Niña", value: "GIRLS_SWEATSHIRT" },
];
const statuses: ReadonlyArray<{ label: string; value: PromotionStatus }> = [
  { label: "Activa", value: "ACTIVE" }, { label: "Disponible", value: "AVAILABLE" },
  { label: "Pendiente", value: "PENDING" }, { label: "Sin promoción", value: "NONE" },
];

export function PromotionsView({ children }: Props) {
  const router = useRouter(); const current = useSearchParams();
  const navigate = (key: string, value?: string) => { const params = new URLSearchParams(current); if (value) params.set(key, value); else params.delete(key); params.delete("cursor"); router.push(`/promociones?${params}`); };
  const search = current.get("search") ?? "";
  return <div className="promotions-layout">
    <Space wrap aria-label="Filtros de promociones">
      <Input aria-label="Buscar producto" placeholder="Buscar producto..." defaultValue={search} onPressEnter={(event) => navigate("search", event.currentTarget.value.trim())} />
      <Select aria-label="Producto" placeholder="Producto" allowClear options={[...products]} value={current.get("productGroup") ?? undefined} onChange={(value) => navigate("productGroup", value)} />
      <Select aria-label="Promoción" placeholder="Promoción" allowClear options={[...statuses]} value={current.get("promotionStatus") ?? undefined} onChange={(value) => navigate("promotionStatus", value)} />
      <Select aria-label="Tipo de promoción" placeholder="Tipo de promoción" allowClear options={[]} value={current.get("promotionType") ?? undefined} onChange={(value) => navigate("promotionType", value)} />
    </Space>
    {children}
  </div>;
}
