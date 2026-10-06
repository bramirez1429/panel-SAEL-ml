"use client";

import { Button, Tag } from "antd";
import { useEffect, useState } from "react";

import type { TiendanubeCategory, TiendanubeReplicationState } from "../domain/tiendanube-replication.model";
import { TiendanubeReplicationModal, type ReplicatePublicationAction } from "./tiendanube-replication-modal.client";

export type { ReplicatePublicationAction } from "./tiendanube-replication-modal.client";

export type GetTiendanubeReplicationStateAction = (
  sourceKey: string,
) => Promise<TiendanubeReplicationState>;

type Props = Readonly<{
  sourceKey: string;
  initialState: TiendanubeReplicationState;
  action: ReplicatePublicationAction;
  categories?: readonly TiendanubeCategory[];
  getStateAction?: GetTiendanubeReplicationStateAction;
}>;

export function TiendanubeReplicationCell({ sourceKey, initialState, action, categories = [], getStateAction }: Props) {
  const [state, setState] = useState(initialState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (initialState.status !== "UNKNOWN" || !getStateAction) return;
    let active = true;
    void getStateAction(sourceKey).then((nextState) => {
      if (active) setState(nextState);
    });
    return () => {
      active = false;
    };
  }, [getStateAction, initialState.status, sourceKey]);

  const modal = (
    <TiendanubeReplicationModal
      open={open}
      sourceKey={sourceKey}
      action={action}
      categories={categories}
      onClose={() => setOpen(false)}
      onResult={(result) => {
        if (result.ok) setState((current) => ({ ...current, sourceKey, status: "COMPLETED" }));
        else setState((current) => ({ ...current, status: "FAILED" }));
      }}
    />
  );

  if (state.status === "PENDING") return <>{modal}<span>Procesando...</span></>;
  if (state.status === "UNKNOWN") return <>{modal}<span>Verificando estado...</span></>;
  if (state.status === "COMPLETED") return <>{modal}<Tag color="green">✓ Replicado</Tag></>;

  return <>
    {modal}
    <Button danger={state.status === "FAILED"} onClick={() => setOpen(true)} size="small">
      {state.status === "FAILED" ? "Reintentar" : "Replicar TN"}
    </Button>
  </>;
}
