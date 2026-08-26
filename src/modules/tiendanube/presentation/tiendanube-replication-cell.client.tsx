"use client";

import { Button, message, Modal, Select, Tag } from "antd";
import { useState } from "react";
import type { ReplicationOptions, TiendanubeCategory, TiendanubeReplicationAction, TiendanubeReplicationState } from "../domain/tiendanube-replication.model";

export type ReplicatePublicationAction = (sourceKey: string, options: ReplicationOptions) => Promise<Readonly<{ ok: true; action: TiendanubeReplicationAction } | { ok: false; message: string }>>;
type Props = Readonly<{ sourceKey: string; initialState: TiendanubeReplicationState; action: ReplicatePublicationAction; categories?: readonly TiendanubeCategory[] }>;

/** Isla cliente para confirmar una réplica; autenticación y HTTP permanecen en el servidor. */
export function TiendanubeReplicationCell({ sourceKey, initialState, action, categories = [] }: Props) {
  const [state, setState] = useState(initialState);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [messageApi, contextHolder] = message.useMessage();
  const replicate = async () => {
    if (loading) return;
    if (!categoryId) { messageApi.error("Seleccioná una categoría."); return; }
    setLoading(true);
    try {
      const result = await action(sourceKey, { categoryId });
      if (result.ok) { setState({ ...state, status: "COMPLETED" }); setOpen(false); messageApi.success("Se replicó correctamente en Tiendanube."); }
      else messageApi.error(result.message);
    } finally { setLoading(false); }
  };
  const categoryOptions = categories.map((category) => ({ label: category.name, value: String(category.id) }));
  const modal = <Modal open={open} title="Replicar en Tiendanube" okText="Replicar" cancelText="Cancelar" confirmLoading={loading} onCancel={() => setOpen(false)} onOk={replicate}>
    {categories.length === 0 ? <p role="alert">No se pudieron cargar las categorías de Tiendanube.</p> : null}
    <Select aria-label="Categoría" placeholder="Seleccionar categoría" value={categoryId || undefined} onChange={setCategoryId} options={categoryOptions} style={{ width: "100%" }} />
  </Modal>;
  if (state.status === "PENDING") return <>{contextHolder}<span>Procesando...</span></>;
  if (state.status === "UNKNOWN") return <>{contextHolder}<span>Verificando estado...</span></>;
  if (state.status === "COMPLETED") return <>{contextHolder}<Tag color="green">✓ Replicado</Tag></>;
  return <>{contextHolder}{modal}<Button danger={state.status === "FAILED"} loading={loading} onClick={() => setOpen(true)} size="small">{state.status === "FAILED" ? "Reintentar" : "Replicar TN"}</Button></>;
}
