"use client";

import { Button, Card, message, Tag } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { IntegrationStatus } from "../domain/integration.model";
import styles from "./integration-card.module.css";

type Props = Readonly<{
  name: string;
  description: string;
  icon: string;
  status: IntegrationStatus;
  detail?: string | null;
  connectHref: string;
  disconnectAction: () => Promise<{ ok: true } | { ok: false; message: string }>;
}>;

export function IntegrationCard({ name, description, icon, status, detail, connectHref, disconnectAction }: Props) {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();
  const disconnect = async () => {
    if (loading) return;
    setLoading(true);
    try { const result = await disconnectAction(); if (result.ok) router.refresh(); else messageApi.error(result.message); }
    finally { setLoading(false); }
  };
  const label = status === "connected" ? "Conectado" : status === "not-connected" ? "No conectado" : "No se pudo verificar el estado";
  return <>{contextHolder}<Card className={styles.card}>
    <div className={styles.heading}><div className={styles.identity}><span className={styles.icon} aria-hidden>{icon}</span><div><h2>{name}</h2><p>{description}</p></div></div><Tag color={status === "connected" ? "success" : status === "unknown" ? "warning" : undefined}>{label}</Tag></div>
    {detail ? <p className={styles.detail}>{detail}</p> : null}
    <div className={styles.actions}>{status === "connected" ? <Button loading={loading} onClick={disconnect}>Desconectar</Button> : status === "not-connected" ? <Button href={connectHref} type="primary">{`Conectar ${name}`}</Button> : <span className={styles.muted}>Reintentá más tarde.</span>}</div>
  </Card></>;
}
