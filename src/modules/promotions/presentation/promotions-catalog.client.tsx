"use client";
import { useState } from "react";
import { Segmented } from "antd";
import type { PromotionsPage } from "../domain/promotion.model";
import { PromotionsTable } from "./promotions-table.client";
type Props = Readonly<{ page: PromotionsPage }>;
export function PromotionsCatalogClient({ page }: Props) {
  const [mode, setMode] = useState<"Masivo" | "Individual">("Masivo");
  const [selected, setSelected] = useState<React.Key[]>([]);
  return <>
    <Segmented options={["Masivo", "Individual"]} value={mode} onChange={(value) => { setMode(value as "Masivo" | "Individual"); setSelected([]); }} />
    {page.publications.length ? <PromotionsTable page={page} mode={mode} selected={selected} onSelectionChange={setSelected} /> : <p>No se encontraron publicaciones.</p>}
    {selected.length ? <p>{selected.length} publicaciones seleccionadas</p> : null}
  </>;
}
