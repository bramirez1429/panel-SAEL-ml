"use client";

import { Button, message, Tag, Tooltip } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TiendanubeReplicationAction, TiendanubeReplicationState } from "../domain/tiendanube-replication.model";

export type ReplicatePublicationAction = (sourceId: string) => Promise<Readonly<{ ok: true; action: TiendanubeReplicationAction } | { ok: false; message: string }>>;

type Props = Readonly<{
  sourceKey: string;
  initialState: TiendanubeReplicationState;
  action: ReplicatePublicationAction;
}>;

/** Isla interactiva: ejecuta la Server Action sin conocer JWT ni URLs del backend. */
export function TiendanubeReplicationCell({ sourceKey, initialState, action }: Props) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();

  const replicate = async () => {
    setLoading(true);
    try {
      const result = await action(sourceKey);
      if (result.ok) {
        setState({ ...state, status: "COMPLETED" });
        messageApi.success("Se replicó correctamente en Tiendanube.");
        router.refresh();
      } else {
        messageApi.error(result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (state.status === "COMPLETED") {
    return <>{contextHolder}<Tag color="green">✓ Replicado</Tag></>;
  }
  if (state.status === "PENDING") {
    return <>{contextHolder}<Button disabled size="small">Procesando...</Button></>;
  }
  return <>{contextHolder}<Button danger={state.status === "FAILED"} disabled={loading} loading={loading} onClick={replicate} size="small">{state.status === "FAILED" ? "Reintentar" : "Replicar TN"}</Button></>;
}

export function TiendanubeRereplicationCell({ sourceKey, initialState, action }: Props) {
  const tooltip = "Próximamente: volver a sincronizar con Tiendanube";
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();

  if (initialState.status === "COMPLETED") {
    const rereplicate = async () => {
      setLoading(true);
      try {
        const result = await action(sourceKey);
        if (result.ok) {
          messageApi.success("Se replicó correctamente en Tiendanube.");
          router.refresh();
        } else {
          messageApi.error(result.message);
        }
      } finally {
        setLoading(false);
      }
    };
    return <>{contextHolder}<Button loading={loading} disabled={loading} onClick={rereplicate} size="small">Volver a replicar</Button></>;
  }

  return <Tooltip title={tooltip}><Button disabled size="small" title={tooltip}>Volver a replicar</Button></Tooltip>;
}
