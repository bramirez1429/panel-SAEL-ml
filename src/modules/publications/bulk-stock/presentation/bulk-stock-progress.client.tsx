"use client";

import {
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { Alert, Card, Flex, Progress, Statistic, Tag, Typography } from "antd";

import type { BulkStockJob, BulkStockJobItem } from "../domain/bulk-stock.model";
import { isBulkStockJobRunning } from "../domain/bulk-stock.model";

export function BulkStockProgress({ job, pollingError }: Readonly<{
  job: BulkStockJob | null;
  pollingError: string | null;
}>) {
  const percent = progressPercent(job);
  const complete = job ? !isBulkStockJobRunning(job.status) : false;

  return (
    <Flex align="center" gap={24} vertical>
      {pollingError ? (
        <Alert
          message={pollingError}
          description="El seguimiento se reintentará automáticamente. El proceso continúa en el backend."
          showIcon
          style={{ alignSelf: "stretch" }}
          type="warning"
        />
      ) : null}
      <Progress
        percent={percent}
        size={170}
        status={complete ? (job?.status === "COMPLETED" ? "success" : "exception") : "active"}
        strokeColor={job?.status === "FAILED" ? "#ff4d4f" : progressColor(percent)}
        type="circle"
      />
      {!complete ? <Typography.Title level={4} style={{ margin: 0 }}>Procesando variantes</Typography.Title> : null}
      <Typography.Text type="secondary">
        {job ? `${job.processed} / ${job.total} procesadas` : "Preparando el proceso…"}
      </Typography.Text>

      {job && isBulkStockJobRunning(job.status) ? (
        <Flex gap={8} style={{ alignSelf: "stretch" }} wrap>
          <Metric label="Correctas" value={job.succeeded} />
          <Metric label="Errores" value={job.errors} />
          <Metric label="Sin cambios" value={job.skipped} />
          <Metric label="Pendientes" value={job.pending} />
        </Flex>
      ) : null}

      {job?.items.length ? (
        <div role="list" style={{ alignSelf: "stretch", border: "1px solid #d9d9d9", borderRadius: 8, maxHeight: "35vh", overflowY: "auto" }}>
          {job.items.map((item) => <JobItem item={item} key={item.key} />)}
        </div>
      ) : null}
    </Flex>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <Card size="small" style={{ flex: "1 1 130px" }}>
      <Statistic styles={{ content: { fontSize: 20 } }} title={label} value={value} />
    </Card>
  );
}

function JobItem({ item }: Readonly<{ item: BulkStockJobItem }>) {
  const state = itemState(item);
  return (
    <div role="listitem" style={{ display: "flex", alignItems: "flex-start", padding: 16, borderBottom: "1px solid #f0f0f0" }}>
      <span aria-label={state.label} style={{ color: state.color, fontSize: 18 }}>{state.icon}</span>
      <div style={{ flex: 1, marginInlineStart: 12 }}>
        <Flex align="center" gap={8} wrap>
          <Typography.Text strong>{[item.title, item.color, item.size].filter(Boolean).join(" / ")}</Typography.Text>
          <Tag color={state.tagColor}>{state.label}</Tag>
        </Flex>
        {item.previousStock !== null && item.newStock !== null ? (
          <Typography.Text type="secondary">{item.previousStock} → {item.newStock}</Typography.Text>
        ) : null}
        {item.message ? <Typography.Text type="danger" style={{ display: "block" }}>{item.message}</Typography.Text> : null}
      </div>
    </div>
  );
}

function itemState(item: BulkStockJobItem): Readonly<{
  label: string;
  icon: React.ReactNode;
  color: string;
  tagColor?: string;
}> {
  if (item.status === "SUCCESS") return { label: "Actualizado", icon: <CheckCircleFilled />, color: "#52c41a", tagColor: "success" };
  if (item.status === "ERROR") return { label: "Error", icon: <CloseCircleFilled />, color: "#ff4d4f", tagColor: "error" };
  if (item.status === "SKIPPED") return { label: "Sin cambios", icon: <MinusCircleOutlined />, color: "#8c8c8c" };
  if (item.status === "PROCESSING") return { label: "Procesando", icon: <LoadingOutlined spin />, color: "#faad14", tagColor: "processing" };
  return { label: "Pendiente", icon: <LoadingOutlined />, color: "#1677ff" };
}

export function progressPercent(job: BulkStockJob | null): number {
  if (!job) return 0;
  if (!isBulkStockJobRunning(job.status)) return 100;
  if (job.total <= 0) return 0;
  return Math.min(99, Math.max(0, Math.round((job.processed / job.total) * 100)));
}

export function progressColor(percent: number): string {
  if (percent >= 75) return "#52c41a";
  if (percent >= 20) return "#faad14";
  return "#1677ff";
}
