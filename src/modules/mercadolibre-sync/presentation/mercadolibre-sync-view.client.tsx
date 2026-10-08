"use client";

import { SyncOutlined } from "@ant-design/icons";
import { Alert, Button, Popconfirm, Progress, Space, Typography } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  MercadolibreActiveSyncActionResult,
  MercadolibreSyncActionResult,
  MercadolibreSyncProgress,
} from "../domain/mercadolibre-sync.model";
import styles from "./mercadolibre-sync-view.module.css";

const STORAGE_KEY = "mercadolibre-publication-sync-id";
const SYNC_POLLING_INTERVAL_MS = 300000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SyncAction = () => Promise<MercadolibreSyncActionResult>;
type SyncStatusAction = (syncId: string) => Promise<MercadolibreSyncActionResult>;
type ActiveSyncAction = () => Promise<MercadolibreActiveSyncActionResult>;
type CancelSyncAction = (syncId: string) => Promise<MercadolibreSyncActionResult>;

type Props = Readonly<{
  startAction: SyncAction;
  getStatusAction: SyncStatusAction;
  getActiveAction?: ActiveSyncAction;
  cancelAction?: CancelSyncAction;
}>;

export function syncPercent(progress: Pick<MercadolibreSyncProgress, "processedItems" | "totalItems">): number {
  if (progress.totalItems === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((progress.processedItems / progress.totalItems) * 100)));
}

export function MercadolibreSyncView({ startAction, getStatusAction, getActiveAction, cancelAction }: Props) {
  const [progress, setProgress] = useState<MercadolibreSyncProgress | null>(null);
  const [syncId, setSyncId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const startingRef = useRef(false);
  const cancellingRef = useRef(false);
  const statusRequestInFlightRef = useRef(false);
  const terminalSyncIdsRef = useRef(new Set<string>());

  const finish = useCallback((next: MercadolibreSyncProgress, activeSyncId: string) => {
    setProgress(next);
    setSyncId(activeSyncId);
    if (next.status === "COMPLETED" || next.status === "FAILED" || next.status === "CANCELLED") {
      terminalSyncIdsRef.current.add(activeSyncId);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const readStatus = useCallback(async (activeSyncId: string): Promise<void> => {
    if (statusRequestInFlightRef.current || terminalSyncIdsRef.current.has(activeSyncId)) return;
    statusRequestInFlightRef.current = true;
    try {
      const result = await getStatusAction(activeSyncId);
      if (terminalSyncIdsRef.current.has(activeSyncId)) return;
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setError(null);
      finish(result, activeSyncId);
    } finally {
      statusRequestInFlightRef.current = false;
    }
  }, [finish, getStatusAction]);

  const recoverActive = useCallback(async (): Promise<"active" | "none" | "error"> => {
    if (!getActiveAction) return "none";

    const result = await getActiveAction();
    if (result === null) return "none";
    if (result.ok === false) {
      setError(result.message);
      return "error";
    }

    window.localStorage.setItem(STORAGE_KEY, result.syncId);
    finish(result, result.syncId);
    return "active";
  }, [finish, getActiveAction]);

  useEffect(() => {
    let disposed = false;

    async function restore(): Promise<void> {
      const active = await recoverActive();
      if (disposed || active !== "none") return;

      const storedSyncId = window.localStorage.getItem(STORAGE_KEY);
      if (!storedSyncId) return;
      if (!UUID_PATTERN.test(storedSyncId)) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      await readStatus(storedSyncId);
    }

    void restore();
    return () => {
      disposed = true;
    };
  }, [readStatus, recoverActive]);

  useEffect(() => {
    if (!syncId || !progress || (progress.status !== "PENDING" && progress.status !== "RUNNING")) return;
    let disposed = false;
    const interval = window.setInterval(() => {
      if (!disposed) void readStatus(syncId);
    }, SYNC_POLLING_INTERVAL_MS);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [progress, readStatus, syncId]);

  async function start(): Promise<void> {
    if (startingRef.current) return;
    startingRef.current = true;
    setError(null);
    setStarting(true);
    try {
      const result = await startAction();
      if (!result.ok) {
        setError(result.message);
        void recoverActive();
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, result.syncId);
      finish(result, result.syncId);
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }

  async function cancel(): Promise<void> {
    if (!syncId || !cancelAction || cancellingRef.current) return;
    cancellingRef.current = true;
    setError(null);
    setCancelling(true);
    try {
      const result = await cancelAction(syncId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      finish(result, syncId);
    } finally {
      cancellingRef.current = false;
      setCancelling(false);
    }
  }

  const status = progress?.status;
  const syncing = status === "PENDING" || status === "RUNNING";
  const completed = status === "COMPLETED";
  const failed = status === "FAILED";
  const cancelled = status === "CANCELLED";
  const percent = progress ? (completed ? 100 : syncPercent(progress)) : 0;

  return <main className={styles.page}>
    <section className={styles.content} aria-live="polite">
      <Typography.Title level={2} className={styles.title}>Sincronización de Mercado Libre</Typography.Title>
      {!syncing && !completed && !failed && !cancelled ? <Typography.Paragraph className={styles.description}>Actualizá las publicaciones guardadas en el panel con la información más reciente de Mercado Libre.</Typography.Paragraph> : null}
      <Progress
        className={styles.progress}
        percent={percent}
        steps={8}
        status={completed ? "success" : failed || cancelled ? "exception" : "active"}
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
      {cancelled ? <Alert className={styles.error} showIcon type="warning" message="Sincronización cancelada." /> : null}
      {failed ? <Alert className={styles.error} showIcon type="error" message="La sincronización no pudo completarse. Intentá nuevamente." /> : null}
      {error ? <Alert className={styles.error} showIcon type="error" message={error} /> : null}
      <Space>
        <Button disabled={syncing || starting || cancelling} icon={syncing || starting ? <SyncOutlined spin /> : undefined} loading={syncing || starting} onClick={() => void start()} type="primary">
          Sincronizar ahora
        </Button>
        {syncing && cancelAction ? (
          <Popconfirm
            cancelText="Volver"
            description="Se detendrá el procesamiento. Las publicaciones ya sincronizadas se conservarán."
            okButtonProps={{ disabled: cancelling, loading: cancelling }}
            okText="Sí, cancelar"
            onConfirm={cancel}
            title="¿Cancelar sincronización?"
          >
            <Button danger disabled={cancelling} loading={cancelling}>
              Cancelar sincronización
            </Button>
          </Popconfirm>
        ) : null}
      </Space>
    </section>
  </main>;
}
