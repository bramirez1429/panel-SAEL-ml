"use client";

import { Alert, Button, Card, Flex, Popconfirm, Space, Typography, message } from "antd";
import { useEffect, useRef, useState } from "react";

import { getDisplayedSync } from "../application/sync-progress";
import type {
  CancelSyncResult,
  StartSyncResult,
  SyncActionResult,
  SyncJob,
  SyncOverview,
} from "../domain/sync.model";
import { isSyncActive } from "../domain/sync.model";
import { fetchSyncStatus } from "../infrastructure/sync-status-api.client";
import { IntegrationEventBanner } from "./integration-event-banner";
import { SyncCircularProgress } from "./sync-circular-progress";
import { SyncErrorBanner } from "./sync-error-banner";
import { SyncNowButton } from "./sync-now-button.client";

const POLLING_INTERVAL_MS = 30_000;

export type GetSyncOverviewAction = () => Promise<SyncActionResult<SyncOverview>>;
export type GetSyncStatus = (
  syncId: string,
  signal?: AbortSignal,
) => Promise<SyncActionResult<SyncJob>>;
export type StartSyncAction = () => Promise<SyncActionResult<StartSyncResult>>;
export type CancelSyncAction = (
  syncId: string,
) => Promise<SyncActionResult<CancelSyncResult>>;

export function SyncStatusCard({
  cancelAction,
  initialOverview,
  getOverviewAction,
  getStatus = fetchSyncStatus,
  startAction,
  pollingIntervalMs = POLLING_INTERVAL_MS,
}: Readonly<{
  initialOverview: SyncOverview | null;
  cancelAction: CancelSyncAction;
  getOverviewAction: GetSyncOverviewAction;
  getStatus?: GetSyncStatus;
  startAction: StartSyncAction;
  pollingIntervalMs?: number;
}>) {
  const [overview, setOverview] = useState(initialOverview);
  const [job, setJob] = useState<SyncJob | null>(initialOverview ? getDisplayedSync(initialOverview) : null);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const startingRef = useRef(false);
  const cancellingRef = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();
  const activeSyncId = job && isSyncActive(job.status) ? job.id : null;

  useEffect(() => {
    if (!activeSyncId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let requestController: AbortController | undefined;

    const poll = async () => {
      requestController = new AbortController();
      const result = await getStatus(activeSyncId, requestController.signal);
      if (cancelled) return;
      if (!result.ok) {
        setPollingError(result.message);
        timer = setTimeout(() => void poll(), pollingIntervalMs);
        return;
      }

      setPollingError(null);
      setJob(result.data);
      if (isSyncActive(result.data.status)) {
        timer = setTimeout(() => void poll(), pollingIntervalMs);
        return;
      }

      const refreshed = await getOverviewAction();
      if (cancelled || !refreshed.ok) return;
      setOverview(refreshed.data);
      setJob(getDisplayedSync(refreshed.data));
    };

    timer = setTimeout(() => void poll(), pollingIntervalMs);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      requestController?.abort();
    };
  }, [activeSyncId, getOverviewAction, getStatus, pollingIntervalMs]);

  const start = async () => {
    if (startingRef.current || (job && isSyncActive(job.status))) return;
    startingRef.current = true;
    setStarting(true);
    try {
      const result = await startAction();
      if (!result.ok) {
        messageApi.error(result.message);
        return;
      }
      setJob({
        id: result.data.syncId,
        status: result.data.status,
        totalItems: 0,
        processedItems: 0,
        successfulItems: 0,
        failedItems: 0,
        startedAt: null,
        finishedAt: null,
        lastError: null,
      });
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  };

  const cancel = async () => {
    if (!job || !isSyncActive(job.status) || cancellingRef.current) return;
    cancellingRef.current = true;
    setCancelling(true);
    try {
      const result = await cancelAction(job.id);
      if (!result.ok) {
        messageApi.error(result.message);
        return;
      }

      setJob((current) => current && current.id === result.data.syncId
        ? { ...current, status: "CANCELLED" }
        : current);
      const refreshed = await getOverviewAction();
      if (refreshed.ok) {
        setOverview(refreshed.data);
        setJob(getDisplayedSync(refreshed.data));
      }
    } finally {
      cancellingRef.current = false;
      setCancelling(false);
    }
  };

  const errorCount = overview?.openErrorsCount ?? job?.failedItems ?? 0;
  const reviewSyncId = job?.id ?? overview?.latestSync?.id;

  return (
    <Card style={{ marginTop: 24 }} title="Sincronización Mercado Libre">
      {contextHolder}
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        {pollingError ? <Alert title={pollingError} showIcon type="warning" /> : null}
        {overview ? <IntegrationEventBanner events={overview.integrationEvents} /> : null}
        <SyncErrorBanner count={errorCount} syncId={reviewSyncId} />
        {job ? (
          <Flex align="center" gap={24} justify="space-between" wrap>
            <SyncCircularProgress job={job} />
            <Space orientation="vertical" size={4}>
              <Typography.Text><strong>Estado:</strong> {statusLabel(job.status)}</Typography.Text>
              <Typography.Text><strong>Última sincronización:</strong> {formatDate(job.finishedAt ?? overview?.latestSync?.finishedAt ?? null)}</Typography.Text>
              <Typography.Text><strong>Próxima automática:</strong> {formatNextSync(overview?.nextAutomaticSyncAt)}</Typography.Text>
              {job.status === "COMPLETED_WITH_ERRORS" ? (
                <Typography.Text type="warning">{job.failedItems} publicaciones necesitan revisión</Typography.Text>
              ) : null}
              {job.status === "FAILED" ? (
                <Alert description={job.lastError ?? "La sincronización no pudo completarse."} title="Falló la sincronización" showIcon type="error" />
              ) : null}
            </Space>
          </Flex>
        ) : (
          <Typography.Text type="secondary">Todavía no hay sincronizaciones registradas.</Typography.Text>
        )}
        <Space wrap>
          <SyncNowButton
            disabled={starting || cancelling || Boolean(job && isSyncActive(job.status))}
            loading={starting}
            onClick={() => void start()}
          />
          {job && isSyncActive(job.status) ? (
            <Popconfirm
              cancelText="Volver"
              description="La sincronización en curso se detendrá."
              okButtonProps={{ danger: true, loading: cancelling }}
              okText="Sí, cancelar"
              title="¿Cancelar sincronización?"
              onConfirm={() => void cancel()}
            >
              <Button danger disabled={cancelling} loading={cancelling}>
                Cancelar sincronización
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      </Space>
    </Card>
  );
}

function statusLabel(status: SyncJob["status"]): string {
  const labels: Readonly<Record<SyncJob["status"], string>> = {
    PENDING: "Pendiente",
    RUNNING: "En proceso",
    COMPLETED: "Completada",
    COMPLETED_WITH_ERRORS: "Completada con errores",
    FAILED: "Fallida",
    CANCELLED: "Cancelada",
  };
  return labels[status];
}

function formatDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
}

function formatNextSync(value: string | undefined): string {
  if (!value || Date.parse(value) <= 0) return "Pendiente";
  return formatDate(value);
}
