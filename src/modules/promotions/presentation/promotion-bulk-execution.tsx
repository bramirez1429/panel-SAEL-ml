import { Alert, Progress, Space, Typography } from "antd";

import { promotionName } from "./promotion-bulk-price.helpers";
import type { SelectedPromotion } from "./promotion-global.store";

export type PromotionExecutionStatus =
  | "pending"
  | "processing"
  | "success"
  | "error";

export type PromotionExecution = Readonly<{
  selection: SelectedPromotion;
  status: PromotionExecutionStatus;
  message: string | null;
}>;

export function pendingExecutions(
  selections: readonly SelectedPromotion[],
): PromotionExecution[] {
  return selections.map((selection) => ({
    selection,
    status: "pending",
    message: null,
  }));
}

export function PromotionExecutionProgress({
  executions,
  processed,
  total,
}: Readonly<{
  executions: readonly PromotionExecution[];
  processed: number;
  total: number;
}>) {
  const percent = total === 0 ? 0 : Math.round((processed / total) * 100);
  const processingIndex = executions.findIndex(
    (execution) => execution.status === "processing",
  );

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Title level={5}>Aplicando promociones</Typography.Title>
      <Progress percent={percent} />
      {processingIndex >= 0 ? (
        <Typography.Text strong>
          Procesando {processingIndex + 1} de {total}
        </Typography.Text>
      ) : null}
      <Typography.Text type="secondary">
        {processed} de {total} procesadas
      </Typography.Text>
      <ExecutionList executions={executions} />
    </Space>
  );
}

export function PromotionFinalSummary({
  successes,
  failures,
}: Readonly<{
  successes: readonly PromotionExecution[];
  failures: readonly PromotionExecution[];
}>) {
  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <Alert
        type={failures.length ? "warning" : "success"}
        showIcon
        title={`${successes.length} correctas · ${failures.length} con error`}
      />
      <ResultBlock title="APLICADAS / PROGRAMADAS" executions={successes} />
      <ResultBlock title="NO SE PUDIERON APLICAR" executions={failures} />
    </Space>
  );
}

function ResultBlock({
  title,
  executions,
}: Readonly<{
  title: string;
  executions: readonly PromotionExecution[];
}>) {
  return (
    <div>
      <Typography.Title level={5}>{title}</Typography.Title>
      {executions.length ? (
        <ExecutionList executions={executions} />
      ) : (
        <Typography.Text type="secondary">Ninguna</Typography.Text>
      )}
    </div>
  );
}

function ExecutionList({
  executions,
}: Readonly<{
  executions: readonly PromotionExecution[];
}>) {
  return (
    <Space orientation="vertical" size="small" style={{ width: "100%" }}>
      {executions.map((execution) => (
        <div key={execution.selection.key}>
          <Typography.Text>
            {statusIcon(execution.status)} {promotionName(execution.selection)} · {execution.selection.itemId}
          </Typography.Text>
          <br />
          <Typography.Text type="secondary">
            {execution.message ?? statusText(execution.status)}
          </Typography.Text>
        </div>
      ))}
    </Space>
  );
}

function statusIcon(status: PromotionExecutionStatus): string {
  if (status === "success") return "✅";
  if (status === "error") return "❌";
  if (status === "processing") return "⏳";
  return "○";
}

function statusText(status: PromotionExecutionStatus): string {
  if (status === "success") return "Participación confirmada";
  if (status === "processing") return "Aplicando...";
  return status === "pending" ? "Pendiente" : "No se pudo aplicar";
}
