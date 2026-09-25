"use client";

import { Button, Space, Table, Tag, Typography, message } from "antd";
import type { TableColumnsType } from "antd";
import { useRef, useState } from "react";

import type {
  RetrySyncErrorsResult,
  SyncActionResult,
  SyncError,
} from "../domain/sync.model";

export type LoadSyncErrorsAction = (
  syncId: string,
) => Promise<SyncActionResult<readonly SyncError[]>>;
export type RetryOneSyncErrorAction = (
  syncId: string,
  errorId: string,
) => Promise<SyncActionResult<RetrySyncErrorsResult>>;
export type RetrySelectedSyncErrorsAction = (
  syncId: string,
  errorIds: readonly string[],
) => Promise<SyncActionResult<RetrySyncErrorsResult>>;
export type RetryAllSyncErrorsAction = (
  syncId: string,
) => Promise<SyncActionResult<RetrySyncErrorsResult>>;

export function SyncErrorsTable({
  syncId,
  initialErrors,
  loadErrorsAction,
  retryOneAction,
  retrySelectedAction,
  retryAllAction,
}: Readonly<{
  syncId: string;
  initialErrors: readonly SyncError[];
  loadErrorsAction: LoadSyncErrorsAction;
  retryOneAction: RetryOneSyncErrorAction;
  retrySelectedAction: RetrySelectedSyncErrorsAction;
  retryAllAction: RetryAllSyncErrorsAction;
}>) {
  const [errors, setErrors] = useState(initialErrors);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const busyRef = useRef(false);
  const [messageApi, contextHolder] = message.useMessage();

  const run = async (
    key: string,
    operation: () => Promise<SyncActionResult<RetrySyncErrorsResult>>,
  ) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyAction(key);
    try {
      const result = await operation();
      if (!result.ok) {
        messageApi.error(result.message);
        return;
      }
      const refreshed = await loadErrorsAction(syncId);
      if (!refreshed.ok) {
        messageApi.warning(refreshed.message);
        return;
      }
      setErrors(refreshed.data);
      setSelectedIds([]);
      messageApi.success(`${result.data.resolvedItems} errores resueltos.`);
    } finally {
      busyRef.current = false;
      setBusyAction(null);
    }
  };

  const columns: TableColumnsType<SyncError> = [
    { title: "MLA", dataIndex: "itemId", key: "itemId", width: 150 },
    { title: "Family ID", dataIndex: "familyId", key: "familyId", width: 170, render: (value: string | null) => value ?? "—" },
    { title: "Tipo", dataIndex: "type", key: "type", width: 190, render: (type: SyncError["type"]) => <Tag>{errorTypeLabel(type)}</Tag> },
    { title: "Motivo", dataIndex: "message", key: "message", render: (value: string) => <Typography.Text>{value}</Typography.Text> },
    { title: "Intentos", dataIndex: "attempts", key: "attempts", width: 90 },
    { title: "Estado", dataIndex: "status", key: "status", width: 110, render: (status: SyncError["status"]) => <Tag color={status === "RETRYING" ? "processing" : "warning"}>{status === "RETRYING" ? "Reintentando" : "Abierto"}</Tag> },
    { title: "Fecha", dataIndex: "createdAt", key: "createdAt", width: 170, render: (value: string) => formatDate(value) },
    {
      title: "Acción",
      key: "action",
      width: 130,
      render: (_, error) => (
        <Button
          aria-label={`Reintentar ${error.itemId}`}
          disabled={busyAction !== null}
          loading={busyAction === error.id}
          size="small"
          onClick={() => void run(error.id, () => retryOneAction(syncId, error.id))}
        >
          Reintentar
        </Button>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      {contextHolder}
      <Space wrap>
        <Button
          disabled={selectedIds.length === 0 || busyAction !== null}
          loading={busyAction === "selected"}
          type="primary"
          onClick={() => void run("selected", () => retrySelectedAction(syncId, selectedIds))}
        >
          Reintentar seleccionados
        </Button>
        <Button
          disabled={errors.length === 0 || busyAction !== null}
          loading={busyAction === "all"}
          onClick={() => void run("all", () => retryAllAction(syncId))}
        >
          Reintentar todos
        </Button>
      </Space>
      <Table<SyncError>
        columns={columns}
        dataSource={[...errors]}
        locale={{ emptyText: "No hay errores abiertos para esta sincronización." }}
        pagination={false}
        rowKey="id"
        rowSelection={{
          selectedRowKeys: [...selectedIds],
          onChange: (keys) => setSelectedIds(keys.map(String)),
        }}
        scroll={{ x: 1150 }}
      />
    </Space>
  );
}

function errorTypeLabel(type: SyncError["type"]): string {
  const labels: Readonly<Record<SyncError["type"], string>> = {
    PUBLICATION_ERROR: "Publicación",
    VALIDATION_ERROR: "Validación",
    AUTH_ERROR: "Autenticación",
    RATE_LIMIT: "Límite de solicitudes",
    PROVIDER_TEMPORARY_ERROR: "Error temporal",
    POSSIBLE_API_CHANGE: "Posible cambio de API",
    MIRROR_WRITE_FAILED: "Copia local pendiente",
  };
  return labels[type];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
