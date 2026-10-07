"use client";

import { SyncOutlined } from "@ant-design/icons";
import { Alert, Button, Progress, Space, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";

import type { MercadolibreSyncActionResult, MercadolibreSyncProgress } from "../domain/mercadolibre-sync.model";
import styles from "./mercadolibre-sync-view.module.css";

const STORAGE_KEY = "mercadolibre-publication-sync-id";

type SyncAction = () => Promise<MercadolibreSyncActionResult>;
type SyncStatusAction = (syncId: string) => Promise<MercadolibreSyncActionResult>;

type Props = Readonly<{
  startAction: SyncAction;
  getStatusAction: SyncStatusAction;
}>;

export function syncPercent(progress: Pick<MercadolibreSyncProgress, "processedItems" | "totalItems">): number {
  if (progress.totalItems === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((progress.processedItems / progress.totalItems) * 100)));
}

export function MercadolibreSyncView({ startAction, getStatusAction }: Props) {
  const [progress, setProgress] = useState<MercadolibreSyncProgress | null>(null);
  const [syncId, setSyncId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const finish = useCallback((next: MercadolibreSyncProgress, activeSyncId: string) => {
    setProgress(next);
    setSyncId(activeSyncId);
    if (next.status === "COMPLETED" || next.status === "FAILED") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const readStatus = useCallback(async (activeSyncId: string): Promise<void> => {
    const result = await getStatusAction(activeSyncId);
    if (!result.ok) {
      setError("No se pudo consultar el estado de la sincronización.");
      return;
    }
    setError(null);
    finish(result, activeSyncId);
  }, [finish, getStatusAction]);

  useEffect(() => {
    const storedSyncId = window.localStorage.getItem(STORAGE_KEY);
    if (!storedSyncId) return;
    void readStatus(storedSyncId);
  }, [readStatus]);

  useEffect(() => {
    if (!syncId || !progress || (progress.status !== "PENDING" && progress.status !== "RUNNING")) return;
    let cancelled = false;
    const interval = window.setInterval(() => {
      if (!cancelled) void readStatus(syncId);
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [progress, readStatus, syncId]);

  async function start(): Promise<void> {
    if (starting) return;
    setError(null);
    setStarting(true);
    try {
      const result = await startAction();
      if (!result.ok) {
        setError("No se pudo iniciar la sincronización.");
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, result.syncId);
      finish(result, result.syncId);
    } finally {
      setStarting(false);
    }
  }

  const status = progress?.status;
  const syncing = status === "PENDING" || status === "RUNNING";
  const completed = status === "COMPLETED";
  const failed = status === "FAILED";
  const percent = progress ? (completed ? 100 : syncPercent(progress)) : 0;

  return <main className={styles.page}>
    <section className={styles.content} aria-live="polite">
      <Typography.Title level={2} className={styles.title}>Sincronización de Mercado Libre</Typography.Title>
      {!syncing && !completed && !failed ? <Typography.Paragraph className={styles.description}>Actualizá las publicaciones guardadas en el panel con la información más reciente de Mercado Libre.</Typography.Paragraph> : null}
      <Progress
        className={styles.progress}
        percent={percent}
        steps={8}
        status={completed ? "success" : failed ? "exception" : "active"}
        type="circle"
      />
      {syncing && progress ? <>
        <Typography.Paragraph className={styles.counts}>{progress.processedItems} de {progress.totalItems} publicaciones</Typography.Paragraph>
        <div className={styles.details}>
          <span>Productos guardados: {progress.productsSaved}</span>
          <span>Variantes guardadas: {progress.childrenSaved}</span>
        </div>
        <Typography.Paragraph>Sincronizando publicaciones...</Typography.Paragraph>
      </> : null}
      {completed ? <Typography.Paragraph strong>Sincronización completada</Typography.Paragraph> : null}
      {failed ? <Alert className={styles.error} showIcon type="error" message="La sincronización no pudo completarse. Intentá nuevamente." /> : null}
      {error ? <Alert className={styles.error} showIcon type="error" message={error} /> : null}
      <Space>
        <Button disabled={syncing || starting} icon={syncing || starting ? <SyncOutlined spin /> : undefined} loading={syncing || starting} onClick={() => void start()} type="primary">
          {completed || failed ? "Sincronizar nuevamente" : "Sincronizar ahora"}
        </Button>
      </Space>
    </section>
  </main>;
}
