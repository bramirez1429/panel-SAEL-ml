"use client";

import { Button, message } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TiendanubeReplicationAction, TiendanubeReplicationState } from "../domain/tiendanube-replication.model";

export type ReplicatePublicationAction = (sourceId: string) => Promise<Readonly<{ ok: true; action: TiendanubeReplicationAction } | { ok: false; message: string }>>;

type Props = Readonly<{
  sourceId: string | null;
  initialState: TiendanubeReplicationState;
  action: ReplicatePublicationAction;
}>;

export function TiendanubeReplicationCell({ sourceId, initialState, action }: Props) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();

  const replicate = async () => {
    if (!sourceId) {
      messageApi.error("La publicación no tiene un product_id válido.");
      return;
    }
    setLoading(true);
    try {
      const result = await action(sourceId);
      if (result.ok) {
        setState({ ...state, status: "COMPLETED" });
        messageApi.success("Se replicó correctamente en Tiendanube.");
        router.refresh();
      } else {
        messageApi.error(result.message);
      }
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "No se pudo replicar la publicación.");
    } finally {
      setLoading(false);
    }
  };

  return <>{contextHolder}<Button disabled={loading || !sourceId || state.status === "PENDING"} loading={loading} onClick={replicate} size="small">Replicar TN</Button></>;
}

export function TiendanubeRereplicationCell({ sourceId, initialState, action }: Props) {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();

  if (initialState.status === "COMPLETED") {
    const rereplicate = async () => {
      if (!sourceId) {
        messageApi.error("La publicación no tiene un product_id válido.");
        return;
      }
      setLoading(true);
      try {
        const result = await action(sourceId);
        if (result.ok) {
          messageApi.success("Se replicó correctamente en Tiendanube.");
          router.refresh();
        } else {
          messageApi.error(result.message);
        }
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : "No se pudo replicar la publicación.");
      } finally {
        setLoading(false);
      }
    };
    return <>{contextHolder}<Button loading={loading} disabled={loading || !sourceId} onClick={rereplicate} size="small">Volver a replicar</Button></>;
  }

  return <>{contextHolder}<Button disabled size="small">Volver a replicar</Button></>;
}
