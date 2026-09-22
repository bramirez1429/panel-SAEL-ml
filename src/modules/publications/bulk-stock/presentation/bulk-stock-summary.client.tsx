"use client";

import { Button, Card, Flex, Result, Space, Statistic, Typography } from "antd";

import type { BulkStockJob, BulkStockPreviewSummary } from "../domain/bulk-stock.model";

export function BulkStockSummary({ summary }: Readonly<{ summary: BulkStockPreviewSummary }>) {
  const values: readonly [string, number][] = [
    ["Encontradas", summary.found],
    ["Modificables", summary.editable],
    ["Activas", summary.active],
    ["Pausadas", summary.paused],
    ["Sin stock", summary.outOfStock],
    ["Sin cambios", summary.unchanged],
    ["USER_PRODUCT", summary.userProduct],
    ["LEGACY", summary.legacy],
  ];

  return (
    <Flex aria-label="Resumen de variantes" gap={8} role="group" wrap>
      {values.map(([label, value]) => (
        <Card key={label} size="small" style={{ flex: "1 1 120px" }}>
          <Statistic styles={{ content: { fontSize: 20 } }} title={label} value={value} />
        </Card>
      ))}
    </Flex>
  );
}

export function BulkStockFinalSummary({
  job,
  retrying,
  onRetryErrors,
  onFinish,
}: Readonly<{
  job: BulkStockJob;
  retrying: boolean;
  onRetryErrors: () => void;
  onFinish: () => void;
}>) {
  return (
    <Result
      status={job.errors > 0 || job.status === "FAILED" ? "warning" : "success"}
      title="Proceso finalizado"
      subTitle={(
        <Space direction="vertical" size={2}>
          <Typography.Text>{job.succeeded} actualizadas</Typography.Text>
          <Typography.Text>{job.skipped} sin cambios</Typography.Text>
          <Typography.Text>{job.errors} errores</Typography.Text>
        </Space>
      )}
      extra={[
        ...(job.errors > 0 ? [
          <Button key="retry" loading={retrying} onClick={onRetryErrors}>
            Reintentar errores
          </Button>,
        ] : []),
        <Button key="finish" disabled={retrying} onClick={onFinish} type="primary">
          Finalizar
        </Button>,
      ]}
    />
  );
}
