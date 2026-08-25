"use client";

import { Button, message, Tag } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TiendanubeReplicationAction, TiendanubeReplicationState } from "../domain/tiendanube-replication.model";

export type ReplicatePublicationAction = (sourceKey: string) => Promise<Readonly<{ ok: true; action: TiendanubeReplicationAction } | { ok: false; message: string }>>;

type Props = Readonly<{
  sourceKey: string;
  initialState: TiendanubeReplicationState;
  action: ReplicatePublicationAction;
}>;

/** Isla interactiva: usa sourceKey y una Server Action; nunca recibe JWT ni conoce URLs. */
export function TiendanubeReplicationCell({ sourceKey, initialState, action }: Props) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();

  const replicate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await action(sourceKey);
      if (result.ok) {
        setState({ ...state, status: "COMPLETED" });
        messageApi.success("Se replicó correctamente en Tiendanube.");
        router.refresh();
      } else messageApi.error(result.message);
    } finally {
      setLoading(false);
    }
  };

  if (state.status === "COMPLETED") return <>{contextHolder}<Tag color="green">✓ Replicado</Tag></>;
  if (state.status === "PENDING") return <>{contextHolder}<span>Procesando...</span></>;
  return <>{contextHolder}<Button danger={state.status === "FAILED"} loading={loading} onClick={replicate} size="small">{state.status === "FAILED" ? "Reintentar" : "Replicar TN"}</Button></>;
}

export function TiendanubeRereplicationCell({ sourceKey, initialState, action }: Props) {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();

  if (initialState.status !== "COMPLETED") return <span>—</span>;

  const rereplicate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await action(sourceKey);
      if (result.ok) {
        messageApi.success("Se replicó correctamente en Tiendanube.");
        router.refresh();
      } else messageApi.error(result.message);
    } finally {
      setLoading(false);
    }
  };

  return <>{contextHolder}<Button loading={loading} onClick={rereplicate} size="small">Volver a replicar</Button></>;
}
