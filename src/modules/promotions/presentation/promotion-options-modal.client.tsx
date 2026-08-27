"use client";
import { useEffect, useState } from "react";
import { Alert, Card, Modal, Spin } from "antd";
import type { PromotionOption } from "../domain/promotions.repository";
import type { PromotionRow } from "../domain/promotion.model";
import { getPromotionOptions } from "./promotion-options.action";
type Props = Readonly<{ open: boolean; row: PromotionRow | null; onClose: () => void }>;
const money = (value: number | null) => value == null ? "—" : `$${value.toLocaleString("es-AR")}`;
export function PromotionOptionsModal({ open, row, onClose }: Props) {
  const [options, setOptions] = useState<readonly PromotionOption[]>([]); const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  useEffect(() => { if (!open || !row) return; let active = true; void Promise.resolve().then(() => { if (!active) return; setState("loading"); setOptions([]); return getPromotionOptions(row.itemId); }).then((value) => { if (active && value) { setOptions(value); setState("success"); } }).catch(() => { if (active) setState("error"); }); return () => { active = false; }; }, [open, row]);
  return <Modal title="Elegir promoción" open={open} onCancel={onClose} footer={null}>{state === "loading" ? <Spin tip="Consultando promociones disponibles..." /> : null}{state === "error" ? <Alert type="error" message="No se pudieron consultar las promociones disponibles." /> : null}{state === "success" && options.length === 0 ? <p>No hay promociones disponibles para esta publicación.</p> : null}{state === "success" ? options.map((option, index) => <Card key={option.id ?? `${option.type ?? "promotion"}-${index}`} title={option.name ?? "Promoción disponible"} size="small"><p><strong>Tipo:</strong> {option.type ?? "—"}</p><p><strong>Precio de lista:</strong> {money(option.originalPrice)}</p><p><strong>Descuento:</strong> {option.discountPercent == null ? "—" : `${option.discountPercent}%`}</p><p><strong>Precio promocional:</strong> {money(option.promotionPrice)}</p><p><strong>A recibir aprox.:</strong> {money(option.saleEstimate?.estimatedNetAmount ?? null)}</p><p><strong>Vigencia:</strong> {option.startDate ?? "—"} - {option.finishDate ?? "—"}</p>{option.canApply ? <p>Aplicar promoción</p> : <p>Esta promoción todavía no puede gestionarse desde el panel.</p>}</Card>) : null}</Modal>;
}
