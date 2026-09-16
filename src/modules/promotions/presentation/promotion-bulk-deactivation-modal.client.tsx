"use client";

import { Alert, Button, Checkbox, List, Modal, Progress, Space, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { deactivateSelectedPromotion } from "./deactivate-selected-promotion.action";
import type { PromotionDeactivationSelection } from "./promotion-deactivation-modal.client";
import { promotionDeactivationKey } from "./promotion-deactivation.helpers";
import { usePromotionGlobalStore } from "./promotion-global.store";

type Props = Readonly<{
  selections: readonly PromotionDeactivationSelection[];
  initialSelectedKeys?: readonly string[];
  onSuccessfulRemoval?: (selections: readonly PromotionDeactivationSelection[]) => void;
  onClose: () => void;
}>;

type Phase = "selecting" | "confirming" | "running" | "finished";

type DeactivationExecution = Readonly<{
  selection: PromotionDeactivationSelection;
  status: "success" | "error";
  message: string | null;
}>;

export function PromotionBulkDeactivationModal({
  selections,
  initialSelectedKeys = [],
  onSuccessfulRemoval,
  onClose,
}: Props) {
  const router = useRouter();
  const activeRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("selecting");
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(
    () => new Set(initialSelectedKeys),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [executions, setExecutions] = useState<readonly DeactivationExecution[]>([]);
  const invalidateOptions = usePromotionGlobalStore((state) => state.invalidateOptions);
  const allKeys = selections.map(selectionKey);
  const selectedCount = selectedKeys.size;
  const allSelected = selections.length > 0 && selectedCount === selections.length;
  const partiallySelected = selectedCount > 0 && !allSelected;
  const successes = executions.filter((execution) => execution.status === "success");
  const failures = executions.filter((execution) => execution.status === "error");

  function toggleSelection(key: string, checked: boolean): void {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleAll(checked: boolean): void {
    setSelectedKeys(new Set(checked ? allKeys : []));
  }

  async function start(): Promise<void> {
    if (activeRef.current || selectedKeys.size === 0) return;

    activeRef.current = true;
    const selected = selections.filter((selection) => selectedKeys.has(selectionKey(selection)));
    const completed: DeactivationExecution[] = [];
    setExecutions([]);
    setCurrentIndex(0);
    setPhase("running");

    try {
      for (let index = 0; index < selected.length; index += 1) {
        const selection = selected[index];
        if (!selection) continue;
        setCurrentIndex(index + 1);

        try {
          const result = await deactivateSelectedPromotion({
            itemId: selection.publication.itemId,
            option: selection.option,
          });
          completed.push(result.ok
            ? { selection, status: "success", message: null }
            : { selection, status: "error", message: result.message });
        } catch {
          completed.push({
            selection,
            status: "error",
            message: "No pudimos dejar esta promoción. Continuamos con la siguiente.",
          });
        }

        setExecutions([...completed]);
      }

      const successfulItemIds = completed
        .filter((execution) => execution.status === "success")
        .map((execution) => execution.selection.publication.itemId);
      invalidateOptions([...new Set(successfulItemIds)]);
      onSuccessfulRemoval?.(
        completed
          .filter((execution) => execution.status === "success")
          .map((execution) => execution.selection),
      );
      router.refresh();
      setPhase("finished");
    } finally {
      activeRef.current = false;
    }
  }

  const footer = phase === "selecting" ? <>
    <Button onClick={onClose}>Cancelar</Button>
    <Button
      danger
      type="primary"
      disabled={selectedCount === 0}
      onClick={() => setPhase("confirming")}
    >
      Dejar de participar de {selectedCount} promociones
    </Button>
  </> : phase === "confirming" ? <>
    <Button onClick={() => setPhase("selecting")}>Volver</Button>
    <Button danger type="primary" onClick={() => void start()}>Confirmar</Button>
  </> : phase === "finished"
    ? <Button type="primary" onClick={onClose}>Listo</Button>
    : null;

  return <Modal
    title="Dejar de participar de promociones"
    open
    width={760}
    onCancel={phase === "running" ? undefined : onClose}
    closable={phase !== "running"}
    mask={{ closable: phase !== "running" }}
    keyboard={phase !== "running"}
    footer={footer}
  >
    {phase === "selecting" ? (
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Checkbox
          aria-label="Seleccionar todas"
          checked={allSelected}
          indeterminate={partiallySelected}
          onChange={(event) => toggleAll(event.target.checked)}
        >
          Seleccionar todas
        </Checkbox>
        <Typography.Text strong>
          {selectedCount} promociones seleccionadas
        </Typography.Text>
        <List
          bordered
          dataSource={[...selections]}
          style={{ maxHeight: 420, overflowY: "auto" }}
          renderItem={(selection) => {
            const key = selectionKey(selection);
            return <List.Item key={key}>
              <Checkbox
                aria-label={`Seleccionar ${selection.option.name ?? "Promoción de Mercado Libre"} ${selection.publication.itemId}`}
                checked={selectedKeys.has(key)}
                onChange={(event) => toggleSelection(key, event.target.checked)}
              >
                <Space orientation="vertical" size={0}>
                  <Typography.Text strong>
                    {selection.option.name ?? "Promoción de Mercado Libre"}
                  </Typography.Text>
                  <Typography.Text>{selection.publication.title}</Typography.Text>
                  <Typography.Text type="secondary">{selection.publication.itemId}</Typography.Text>
                </Space>
              </Checkbox>
            </List.Item>;
          }}
        />
      </Space>
    ) : phase === "confirming" ? (
      <Alert
        showIcon
        type="warning"
        title={`¿Confirmás que querés dejar de participar de ${selectedCount} promociones?`}
      />
    ) : phase === "running" ? (
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Typography.Text strong>
          Procesando {currentIndex} de {selectedCount}
        </Typography.Text>
        <Progress
          percent={selectedCount === 0 ? 0 : Math.round((executions.length / selectedCount) * 100)}
        />
      </Space>
    ) : (
      <DeactivationSummary successes={successes} failures={failures} />
    )}
  </Modal>;
}

function DeactivationSummary({
  successes,
  failures,
}: Readonly<{
  successes: readonly DeactivationExecution[];
  failures: readonly DeactivationExecution[];
}>) {
  return <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
    <Typography.Title level={4} style={{ margin: 0 }}>
      {successes.length} eliminadas · {failures.length} con error
    </Typography.Title>
    {successes.length > 0 ? <ResultList title="ELIMINADAS CORRECTAMENTE" executions={successes} /> : null}
    {failures.length > 0 ? <ResultList title="NO SE PUDIERON ELIMINAR" executions={failures} /> : null}
  </Space>;
}

function ResultList({
  title,
  executions,
}: Readonly<{
  title: string;
  executions: readonly DeactivationExecution[];
}>) {
  return <div>
    <Typography.Text strong>{title}</Typography.Text>
    <List
      size="small"
      dataSource={[...executions]}
      renderItem={(execution) => <List.Item>
        <Space orientation="vertical" size={0}>
          <Typography.Text>
            {execution.selection.option.name ?? "Promoción de Mercado Libre"} · {execution.selection.publication.itemId}
          </Typography.Text>
          {execution.message ? <Typography.Text type="danger">{execution.message}</Typography.Text> : null}
        </Space>
      </List.Item>}
    />
  </div>;
}

function selectionKey(selection: PromotionDeactivationSelection): string {
  return promotionDeactivationKey(selection.publication.itemId, selection.option);
}
