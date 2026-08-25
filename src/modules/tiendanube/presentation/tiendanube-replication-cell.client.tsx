"use client";

import { Button, message, Tag, Tooltip } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TiendanubeReplicationState } from "../domain/tiendanube-replication.model";

export type ReplicatePublicationAction = (sourceKey: string) => Promise<Readonly<{ ok: true } | { ok: false; message: string }>>;

type Props = Readonly<{
  sourceKey: string;
  initialState: TiendanubeReplicationState;
  action: ReplicatePublicationAction;
}>;

/** Isla interactiva: recibe sólo sourceKey/estado y nunca conoce JWT ni URLs. */
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

  return <>{contextHolder}{renderState(state.status, replicate, loading)}</>;
}

/** Acción reservada hasta que el backend exponga una re-replicación real. */
export function TiendanubeRereplicationCell() {
  const tooltip = "Próximamente: volver a sincronizar con Tiendanube";
  return (
    <Tooltip title={tooltip}>
      <Button disabled size="small" title={tooltip}>Volver a replicar</Button>
    </Tooltip>
  );
}

function renderState(status: TiendanubeReplicationState["status"], replicate: () => Promise<void>, loading: boolean) {
  if (status === "COMPLETED") return <Tag color="green">Replicado</Tag>;
  if (status === "PENDING") return <><Tag>Procesando</Tag><Button disabled>Replicar</Button></>;
  if (status === "FAILED") return <><Tag color="red">Error</Tag><Button danger disabled={loading} loading={loading} onClick={replicate}>Reintentar</Button></>;
  return <Button disabled={loading} loading={loading} onClick={replicate}>Replicar</Button>;
}
