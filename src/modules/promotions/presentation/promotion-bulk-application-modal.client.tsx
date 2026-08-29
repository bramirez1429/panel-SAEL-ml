"use client";

import { Alert, Button, InputNumber, List, Modal, Progress, Space, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { applySelectedPromotion } from "./apply-selected-promotion.action";
import type { SelectedPromotion } from "./promotion-global.store";
import { usePromotionGlobalStore } from "./promotion-global.store";

type Props = Readonly<{ selections: readonly SelectedPromotion[]; onClose: () => void }>;
type ExecutionStatus = "pending" | "processing" | "success" | "error";
type Execution = Readonly<{ selection: SelectedPromotion; status: ExecutionStatus; message: string | null }>;

const moneyFormatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export function PromotionBulkApplicationModal({ selections, onClose }: Props) {
  const router = useRouter();
  const activeRef = useRef(false);
  const [prices, setPrices] = useState<Readonly<Record<string, number | null>>>(() => initialPrices(selections));
  const [executions, setExecutions] = useState<readonly Execution[]>(() => pendingExecutions(selections));
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const removeSelections = usePromotionGlobalStore((state) => state.removeSelections);
  const invalidateOptions = usePromotionGlobalStore((state) => state.invalidateOptions);
  const valid = selections.every((selection) => validSelectionPrice(selection, prices[selection.key] ?? null));
  const processed = executions.filter((execution) => execution.status === "success" || execution.status === "error").length;
  const successes = executions.filter((execution) => execution.status === "success");
  const failures = executions.filter((execution) => execution.status === "error");

  async function start(): Promise<void> {
    if (activeRef.current || !valid) return;

    activeRef.current = true;
    setRunning(true);

    const completed: Execution[] = pendingExecutions(selections);

    try {
      for (let index = 0; index < selections.length; index += 1) {
        const selection = selections[index];
        if (!selection) continue;

        completed[index] = {
          selection,
          status: "processing",
          message: null,
        };

        setExecutions([...completed]);

        try {
          const result = await applySelectedPromotion({
            itemId: selection.itemId,
            option: selection.option,
            selectedPrice:
              selection.option.requiresPriceSelection === true
                ? prices[selection.key] ?? null
                : null,
          });

          completed[index] = result.ok
            ? {
                selection,
                status: "success",
                message: null,
              }
            : {
                selection,
                status: "error",
                message: result.message,
              };
        } catch {
          completed[index] = {
            selection,
            status: "error",
            message:
              "No pudimos completar esta promoción. Continuamos con la siguiente.",
          };
        }

        setExecutions([...completed]);
      }

      const successfulKeys = completed
        .filter((execution) => execution.status === "success")
        .map((execution) => execution.selection.key);

      removeSelections(successfulKeys);

      const itemIds = [
        ...new Set(selections.map((selection) => selection.itemId)),
      ];

      invalidateOptions(itemIds);

      setFinished(true);
      router.refresh();
    } finally {
      setRunning(false);
      activeRef.current = false;
    }
  }

  return <Modal
    title={finished ? "Proceso completado" : "Promociones seleccionadas"}
    open
    onCancel={running ? undefined : onClose}
    closable={!running}
    maskClosable={!running}
    keyboard={!running}
    footer={finished
      ? <Button type="primary" onClick={onClose}>Listo</Button>
      : running ? null : <Button type="primary" disabled={!valid} onClick={() => void start()}>Participar en {selections.length} promociones</Button>}
  >
    {finished
      ? <FinalSummary successes={successes} failures={failures} />
      : running
        ? <ExecutionProgress executions={executions} processed={processed} total={selections.length} />
        : <Review selections={selections} prices={prices} onPriceChange={(key, price) => setPrices((current) => ({ ...current, [key]: price }))} />}
  </Modal>;
}

function Review({ selections, prices, onPriceChange }: Readonly<{
  selections: readonly SelectedPromotion[];
  prices: Readonly<Record<string, number | null>>;
  onPriceChange: (key: string, price: number | null) => void;
}>) {
  return <List dataSource={[...selections]} renderItem={(selection) => <List.Item>
    <Space direction="vertical" size={2} style={{ width: "100%" }}>
      <Typography.Text strong>{promotionName(selection)}</Typography.Text>
      <Typography.Text>{selection.publicationTitle}</Typography.Text>
      <Typography.Text type="secondary">{selection.itemId}</Typography.Text>
      <Typography.Text>Precio actual: {money(selection.option.originalPrice)}</Typography.Text>
      {selection.option.requiresPriceSelection === true
        ? <>
          <Typography.Text>Precio a aplicar</Typography.Text>
          <InputNumber aria-label={`Precio a aplicar ${selection.itemId}`} value={prices[selection.key] ?? null}
            min={selection.option.minPromotionPrice ?? undefined} max={selection.option.maxPromotionPrice ?? undefined}
            onChange={(value) => onPriceChange(selection.key, value)} style={{ width: "100%" }} />
          <PriceRange selection={selection} />
        </>
        : <Typography.Text>Precio promocional: {money(selection.option.promotionPrice)}</Typography.Text>}
    </Space>
  </List.Item>} />;
}

function PriceRange({ selection }: Readonly<{ selection: SelectedPromotion }>) {
  const minimum = selection.option.minPromotionPrice;
  const maximum = selection.option.maxPromotionPrice;
  if (minimum === null && maximum === null) return null;
  return <Typography.Text type="secondary">Rango permitido: {money(minimum)} - {money(maximum)}</Typography.Text>;
}

function ExecutionProgress({ executions, processed, total }: Readonly<{ executions: readonly Execution[]; processed: number; total: number }>) {
  const percent = total === 0 ? 0 : Math.round((processed / total) * 100);
  return <Space direction="vertical" size="middle" style={{ width: "100%" }}>
    <Typography.Title level={5}>Aplicando promociones</Typography.Title>
    <Progress percent={percent} />
    <Typography.Text>{processed} de {total} procesadas</Typography.Text>
    <ExecutionList executions={executions} />
  </Space>;
}

function ExecutionList({ executions }: Readonly<{ executions: readonly Execution[] }>) {
  return <List dataSource={[...executions]} renderItem={(execution) => <List.Item>
    <List.Item.Meta avatar={<span>{statusIcon(execution.status)}</span>}
      title={`${promotionName(execution.selection)} · ${execution.selection.itemId}`}
      description={execution.message ?? statusText(execution.status)} />
  </List.Item>} />;
}

function FinalSummary({ successes, failures }: Readonly<{ successes: readonly Execution[]; failures: readonly Execution[] }>) {
  return <Space direction="vertical" size="large" style={{ width: "100%" }}>
    <Alert type={failures.length ? "warning" : "success"} showIcon message={`${successes.length} aplicadas · ${failures.length} con error`} />
    <ResultBlock title="APLICADAS" executions={successes} />
    <ResultBlock title="NO SE PUDIERON APLICAR" executions={failures} />
  </Space>;
}

function ResultBlock({ title, executions }: Readonly<{ title: string; executions: readonly Execution[] }>) {
  return <div><Typography.Title level={5}>{title}</Typography.Title>{executions.length
    ? <ExecutionList executions={executions} />
    : <Typography.Text type="secondary">Ninguna</Typography.Text>}</div>;
}

function pendingExecutions(selections: readonly SelectedPromotion[]): Execution[] {
  return selections.map((selection) => ({ selection, status: "pending", message: null }));
}

function initialPrices(selections: readonly SelectedPromotion[]): Readonly<Record<string, number | null>> {
  return Object.fromEntries(selections.map((selection) => [selection.key, validSuggestedPrice(selection) ? selection.option.suggestedPromotionPrice : null]));
}

function validSuggestedPrice(selection: SelectedPromotion): boolean {
  const price = selection.option.suggestedPromotionPrice;
  return price !== null && validSelectionPrice(selection, price);
}

function validSelectionPrice(selection: SelectedPromotion, price: number | null): boolean {
  if (selection.option.requiresPriceSelection !== true) return selection.option.promotionPrice !== null && selection.option.promotionPrice > 0;
  if (price === null || !Number.isFinite(price) || price <= 0) return false;
  if (selection.option.minPromotionPrice !== null && price < selection.option.minPromotionPrice) return false;
  return selection.option.maxPromotionPrice === null || price <= selection.option.maxPromotionPrice;
}

function promotionName(selection: SelectedPromotion): string {
  return selection.option.name ?? "Promoción de Mercado Libre";
}

function money(value: number | null): string {
  return value === null ? "—" : moneyFormatter.format(value);
}

function statusIcon(status: ExecutionStatus): string {
  if (status === "success") return "✅";
  if (status === "error") return "❌";
  if (status === "processing") return "⏳";
  return "○";
}

function statusText(status: ExecutionStatus): string {
  if (status === "success") return "Aplicada";
  if (status === "processing") return "Aplicando...";
  return status === "pending" ? "Pendiente" : "No se pudo aplicar";
}
