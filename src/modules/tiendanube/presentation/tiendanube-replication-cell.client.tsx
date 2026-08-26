"use client";

import { Button, InputNumber, message, Modal, Radio, Select, Tag } from "antd";
import { useState } from "react";
import type { ReplicationOptions, TiendanubeCategory, TiendanubeReplicationAction, TiendanubeReplicationState } from "../domain/tiendanube-replication.model";

export type ReplicatePublicationAction = (sourceKey: string, options: ReplicationOptions) => Promise<Readonly<{ ok: true; action: TiendanubeReplicationAction } | { ok: false; message: string }>>;
type Props = Readonly<{ sourceKey: string; initialState: TiendanubeReplicationState; action: ReplicatePublicationAction; categories?: readonly TiendanubeCategory[] }>;

/** Isla cliente para configurar la réplica; autenticación y HTTP permanecen en el servidor. */
export function TiendanubeReplicationCell({ sourceKey, initialState, action, categories = [] }: Props) {
  const [state, setState] = useState(initialState);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priceMode, setPriceMode] = useState<ReplicationOptions["priceMode"]>("KEEP_SOURCE");
  const [price, setPrice] = useState<number>();
  const [tagMode, setTagMode] = useState<ReplicationOptions["tagMode"]>("KEEP_SOURCE");
  const [tags, setTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(categories[0]?.id);
  const mantenerPrecio = priceMode === "KEEP_SOURCE";
  const [messageApi, contextHolder] = message.useMessage();
  const replicate = async () => {
    if (loading) return;
    if (categoryId === undefined) { messageApi.error("Seleccioná una categoría."); return; }
    if (priceMode === "OVERRIDE" && (price === undefined || !Number.isFinite(price) || price <= 0)) { messageApi.error("El precio debe ser mayor que cero."); return; }
    const normalizedTags = normalizeTags(tags);
    if (tagMode === "OVERRIDE" && normalizedTags.length === 0) { messageApi.error("Agregá al menos un tag."); return; }
    setLoading(true);
    try {
      const options: ReplicationOptions = { priceMode, tagMode, categoryId, ...(priceMode === "OVERRIDE" && price !== undefined ? { price } : {}), ...(tagMode === "OVERRIDE" ? { tags: normalizedTags } : {}) };
      const result = await action(sourceKey, options);
      if (result.ok) { setState({ ...state, status: "COMPLETED" }); setOpen(false); messageApi.success("Se replicó correctamente en Tiendanube."); }
      else messageApi.error(result.message);
    } finally { setLoading(false); }
  };
  const modal = <Modal open={open} title="Replicar en Tiendanube" okText="Replicar" cancelText="Cancelar" confirmLoading={loading} onCancel={() => setOpen(false)} onOk={replicate}>
    <p>¿Mantener precio de Mercado Libre?</p>
    <Radio.Group aria-label="Mantener precio de Mercado Libre" value={mantenerPrecio} onChange={(event) => setPriceMode(event.target.value ? "KEEP_SOURCE" : "OVERRIDE")} options={[{ label: "Sí", value: true }, { label: "No", value: false }]} />
    {!mantenerPrecio ? <InputNumber aria-label="Precio" prefix="$" min={0.01} value={price} onChange={(value) => setPrice(value ?? undefined)} style={{ width: "100%", marginTop: 12 }} formatter={(value) => value === undefined ? "" : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")} parser={(value) => Number((value ?? "").replace(/\./g, ""))} /> : null}
    <p>¿Mantener tags de Mercado Libre?</p>
    <Radio.Group aria-label="Mantener tags de Mercado Libre" value={tagMode === "KEEP_SOURCE"} onChange={(event) => setTagMode(event.target.value ? "KEEP_SOURCE" : "OVERRIDE")} options={[{ label: "Sí", value: true }, { label: "No", value: false }]} />
    {tagMode === "OVERRIDE" ? <Select mode="tags" aria-label="Tags" tokenSeparators={[","]} placeholder="Agregar tags" value={tags} onChange={setTags} style={{ width: "100%", marginTop: 12 }} /> : null}
    <Select aria-label="Categoría" placeholder="Seleccionar categoría" value={categoryId} onChange={setCategoryId} options={categories.map((category) => ({ label: category.name, value: category.id }))} style={{ width: "100%", marginTop: 12 }} />
  </Modal>;
  if (state.status === "PENDING") return <>{contextHolder}<span>Procesando...</span></>;
  if (state.status === "UNKNOWN") return <>{contextHolder}<span>Verificando estado...</span></>;
  if (state.status === "COMPLETED") return <>{contextHolder}<Tag color="green">✓ Replicado</Tag></>;
  return <>{contextHolder}{modal}<Button danger={state.status === "FAILED"} loading={loading} onClick={() => setOpen(true)} size="small">{state.status === "FAILED" ? "Reintentar" : "Replicar TN"}</Button></>;
}

function normalizeTags(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLocaleLowerCase("es");
    if (key && !seen.has(key)) { seen.add(key); result.push(trimmed); }
  }
  return result;
}
