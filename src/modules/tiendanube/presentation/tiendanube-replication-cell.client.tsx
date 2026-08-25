"use client";

import { Button, message, Tag, Tooltip } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TiendanubeReplicationState } from "../domain/tiendanube-replication.model";
import type { TiendanubeReplicationAction } from "../domain/tiendanube-replication.model";

export type ReplicatePublicationAction = (sourceId: string) => Promise<Readonly<{ ok: true; action: TiendanubeReplicationAction } | { ok: false; message: string }>>;

type Props = Readonly<{
  sourceId: string;
  initialState: TiendanubeReplicationState;
  action: ReplicatePublicationAction;
}>;

/** Isla interactiva: recibe sólo sourceKey/estado y nunca conoce JWT ni URLs. */
export function TiendanubeReplicationCell({ sourceId, initialState, action }: Props) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<TiendanubeReplicationAction | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();

  const replicate = async () => {
    setLoading(true);
    try {
      const result = await action(sourceId);
      if (result.ok) {
        setState({ ...state, status: "COMPLETED" });
        setLastAction(result.action);
        messageApi.success("Se replicó correctamente en Tiendanube.");
        router.refresh();
      } else {
        messageApi.error(result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return <>{contextHolder}{renderState(state.status, lastAction, replicate, loading)}</>;
}

/** Acción reservada hasta que el backend exponga una re-replicación real. */
type RereplicationProps = Readonly<{
  sourceId: string;
  initialState: TiendanubeReplicationState;
  action: ReplicatePublicationAction;
}>;

export function TiendanubeRereplicationCell({ sourceId, initialState, action }: RereplicationProps) {
  const tooltip = "Próximamente: volver a sincronizar con Tiendanube";
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();

  if (initialState.status === "COMPLETED") {
    const rereplicate = async () => {
      setLoading(true);
      try {
        const result = await action(sourceId);
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

  return (
    <Tooltip title={tooltip}>
      <Button disabled size="small" title={tooltip}>Volver a replicar</Button>
    </Tooltip>
  );
}

function renderState(status: TiendanubeReplicationState["status"], lastAction: TiendanubeReplicationAction | null, replicate: () => Promise<void>, loading: boolean) {
  if (lastAction === "created") return <><Tag color="green">✓ Publicado en Tiendanube</Tag><Button size="small" onClick={replicate}>Volver a replicar</Button></>;
  if (lastAction === "updated") return <><Tag color="green">✓ Actualizado en Tiendanube</Tag><Button size="small" onClick={replicate}>Volver a replicar</Button></>;
  if (status === "COMPLETED") return <><Tag color="green">Replicado</Tag><Button size="small" onClick={replicate}>Volver a replicar</Button></>;
  if (status === "PENDING") return <><Tag>Procesando</Tag><Button disabled loading={loading} size="small">Replicando...</Button></>;
  if (status === "FAILED") return <><Tag color="red">Error</Tag><Button danger disabled={loading} loading={loading} onClick={replicate}>Reintentar</Button></>;
  return <><Tag>Sin replicar</Tag><Button disabled={loading} loading={loading} onClick={replicate}>Replicar a Tiendanube</Button></>;
}
