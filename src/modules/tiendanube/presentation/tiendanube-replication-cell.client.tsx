"use client";

import { Button, InputNumber, message, Modal, Select, Tag } from "antd";
import { useState } from "react";
import type { ReplicationOptions, TiendanubeCategory, TiendanubeReplicationAction, TiendanubeReplicationState, TiendanubeStoreSummary } from "../domain/tiendanube-replication.model";

export type ReplicatePublicationAction = (sourceKey: string, options: ReplicationOptions) => Promise<Readonly<{ ok: true; action: TiendanubeReplicationAction } | { ok: false; message: string }>>;
type Props = Readonly<{ sourceKey: string; initialState: TiendanubeReplicationState; action: ReplicatePublicationAction; categories?: readonly TiendanubeCategory[]; storeSummary?: TiendanubeStoreSummary | null }>;

/** Configura la réplica en una isla cliente; las credenciales y llamadas HTTP permanecen server-side. */
export function TiendanubeReplicationCell({ sourceKey, initialState, action, categories = [], storeSummary = null }: Props) {
  const [state, setState] = useState(initialState);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priceMode, setPriceMode] = useState<ReplicationOptions["priceMode"]>("KEEP_SOURCE");
  const [price, setPrice] = useState<number>();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [messageApi, contextHolder] = message.useMessage();

  const replicate = async () => {
    if (loading) return;
    if (!categoryId) { messageApi.error("Seleccioná una categoría."); return; }
    if (priceMode === "OVERRIDE" && (price === undefined || !Number.isFinite(price) || price <= 0)) { messageApi.error("El precio debe ser mayor que cero."); return; }
    setLoading(true);
    try {
      const options: ReplicationOptions = { priceMode, categoryId, ...(priceMode === "OVERRIDE" && price !== undefined ? { price } : {}) };
      const result = await action(sourceKey, options);
      if (result.ok) { setState({ ...state, status: "COMPLETED" }); setOpen(false); messageApi.success("Se replicó correctamente en Tiendanube."); }
      else messageApi.error(result.message);
    } finally { setLoading(false); }
  };
  const planFee = storeSummary ? ({ Esencial: "2%", Impulso: "1%", Escala: "0.7%", Evolución: "Negociable" } as Record<string, string>)[storeSummary.planName] : undefined;
  const modal = <Modal open={open} title="Configurar replicación" okText="Replicar" cancelText="Cancelar" confirmLoading={loading} onCancel={() => setOpen(false)} onOk={replicate}>
    <Select aria-label="Modo de precio" value={priceMode} onChange={setPriceMode} options={[{ label: "Mantener precio de Mercado Libre", value: "KEEP_SOURCE" }, { label: "Usar otro precio", value: "OVERRIDE" }]} style={{ width: "100%" }} />
    {priceMode === "OVERRIDE" ? <InputNumber aria-label="Precio" min={0.01} value={price} onChange={(value) => setPrice(value ?? undefined)} style={{ width: "100%", marginTop: 12 }} /> : null}
    <Select aria-label="Categoría" placeholder="Seleccionar categoría" value={categoryId || undefined} onChange={setCategoryId} options={categories.map((category) => ({ label: category.path ?? category.name, value: category.id }))} style={{ width: "100%", marginTop: 12 }} />
    {storeSummary ? <small>{storeSummary.planName}{planFee ? ` · ${planFee}` : ""} · Pago Nube: costo por transacción Tiendanube 0%</small> : null}
  </Modal>;
  if (state.status === "PENDING") return <>{contextHolder}<span>Procesando...</span></>;
  if (state.status === "UNKNOWN") return <>{contextHolder}<span>Verificando estado...</span></>;
  if (state.status === "COMPLETED") return <>{contextHolder}<Tag color="green">✓ Replicado</Tag>{modal}<Button size="small" onClick={() => setOpen(true)}>Volver a replicar</Button></>;
  return <>{contextHolder}{modal}<Button danger={state.status === "FAILED"} loading={loading} onClick={() => setOpen(true)} size="small">{state.status === "FAILED" ? "Reintentar" : "Replicar Tiendanube"}</Button></>;
}

export function TiendanubeRereplicationCell(props: Props) {
  if (props.initialState.status !== "COMPLETED") return <span>—</span>;
  return <TiendanubeReplicationCell {...props} />;
}
