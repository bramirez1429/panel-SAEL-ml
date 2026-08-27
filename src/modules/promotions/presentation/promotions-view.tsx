"use client";

import { useState, type ReactNode } from "react";
import { Button, Input, Segmented, Select, Space } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import type { PromotionProductGroup, PromotionsPage, PromotionStatus } from "../domain/promotion.model";
import { PromotionsTable } from "./promotions-table.client";

type Props = Readonly<{ children?: ReactNode; page?: PromotionsPage; catalogError?: boolean; promotionTypes?: readonly string[] }>;
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

export function PromotionsView({ children, page, catalogError = false, promotionTypes = [] }: Props) {
  const router = useRouter(); const current = useSearchParams(); const [mode, setMode] = useState<"Masivo" | "Individual">("Masivo"); const [selected, setSelected] = useState<React.Key[]>([]);
  const navigate = (key: string, value?: string) => { const params = new URLSearchParams(current); if (value) params.set(key, value); else params.delete(key); params.delete("cursor"); router.push(`/promociones?${params}`); };
  const search = current.get("search") ?? "";
  return <div className="promotions-layout">
    <Segmented options={["Masivo", "Individual"]} value={mode} onChange={(value) => { setMode(value as "Masivo" | "Individual"); setSelected([]); }} />
    <Space wrap aria-label="Filtros de promociones">
      <Input aria-label="Buscar producto" placeholder="Buscar producto..." defaultValue={search} onPressEnter={(event) => navigate("search", event.currentTarget.value.trim())} />
      <Select aria-label="Producto" placeholder="Producto" allowClear options={[...products]} value={current.get("productGroup") ?? undefined} onChange={(value) => navigate("productGroup", value)} />
      <Select aria-label="Promoción" placeholder="Promoción" allowClear options={[...statuses]} value={current.get("promotionStatus") ?? undefined} onChange={(value) => navigate("promotionStatus", value)} />
      <Select aria-label="Tipo de promoción" placeholder="Tipo de promoción" allowClear options={promotionTypes.map((type) => ({ label: type, value: type }))} value={current.get("promotionType") ?? undefined} onChange={(value) => navigate("promotionType", value)} />
    </Space>
    {catalogError ? <p role="alert">No se pudieron cargar las publicaciones de promociones.</p> : children ?? (page ? <PromotionsTable page={page} mode={mode} selected={selected} onSelectionChange={setSelected} /> : <p>Cargando promociones…</p>)}
    {!catalogError && page && page.publications.length === 0 ? <p>{current.get("promotionStatus") || current.get("promotionType") ? "No hay publicaciones que coincidan con estos filtros." : "No se encontraron publicaciones."}</p> : null}
    {selected.length > 0 ? <Space><span>{selected.length} publicaciones seleccionadas</span><Button>Cambiar promoción</Button><Button>Quitar promoción</Button></Space> : null}
  </div>;
}
