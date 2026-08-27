"use client";

import {
  Alert,
  Button,
  Card,
  Modal,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { PromotionActionFailure } from "../domain/promotion-action.model";
import {
  publicationSourceKey,
  previewAllowsApplication,
  type PublicationPromotionPreview,
  type PublicationPromotionResult,
} from "../domain/publication-promotion.model";
import type { PromotionRow } from "../domain/promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { applyPromotion } from "./apply-promotion.action";
import { PromotionExecutionStatus } from "./promotion-execution-status";
import { PromotionFinancialSummary } from "./promotion-financial-summary";
import { getPromotionOptions } from "./promotion-options.action";
import { getPromotionPreview } from "./promotion-preview.action";
import { PromotionPreview } from "./promotion-preview";
import { handlePromotionCompletion } from "./promotion-result.handler";
import { useSingleSubmission } from "./use-single-submission.client";

type Props = Readonly<{
  open: boolean;
  row: PromotionRow | null;
  onClose: () => void;
}>;

type OptionsState = "idle" | "loading" | "success" | "error";

export function PromotionOptionsModal({ open, row, onClose }: Props) {
  const router = useRouter();
  const submission = useSingleSubmission();
  const [options, setOptions] = useState<readonly PromotionOption[]>([]);
  const [optionsState, setOptionsState] = useState<OptionsState>("idle");
  const [selected, setSelected] = useState<PromotionOption | null>(null);
  const [preview, setPreview] = useState<PublicationPromotionPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [failure, setFailure] = useState<PromotionActionFailure | null>(null);
  const [partial, setPartial] = useState<PublicationPromotionResult | null>(null);

  useEffect(() => {
    if (!open || !row) return;
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return null;
        setOptionsState("loading");
        setOptions([]);
        resetSelection();
        return getPromotionOptions(row.itemId);
      })
      .then((value) => {
        if (!active || !value) return;
        setOptions(value);
        setOptionsState("success");
      })
      .catch(() => {
        if (active) setOptionsState("error");
      });
    return () => {
      active = false;
    };
  }, [open, row]);

  function resetSelection(): void {
    setSelected(null);
    setPreview(null);
    setPreviewLoading(false);
    setFailure(null);
    setPartial(null);
  }

  async function loadPreview(option: PromotionOption): Promise<void> {
    if (!row) return;
    setSelected(option);
    setPreview(null);
    setFailure(null);
    setPreviewLoading(true);
    const result = await getPromotionPreview(publicationSourceKey(row), option);
    setPreviewLoading(false);
    if (result.ok) setPreview(result.preview);
    else setFailure(result);
  }

  async function confirmApplication(): Promise<void> {
    if (!row || !selected || !preview || !previewAllowsApplication(preview))
      return;
    setFailure(null);
    const attempt = await submission.run(() =>
      applyPromotion(publicationSourceKey(row), selected),
    );
    if (!attempt.started) return;
    if (!attempt.value.ok) {
      setFailure(attempt.value);
      return;
    }
    handlePromotionCompletion(
      attempt.value.result,
      "Promoción aplicada a toda la publicación.",
      {
        showSuccess: (text) => message.success(text),
        showPartial: setPartial,
        close: onClose,
        refresh: () => router.refresh(),
      },
    );
  }

  const closeSafely = () => {
    if (!submission.loading) onClose();
  };
  const applyingText =
    (preview?.totalItems ?? 1) > 1
      ? `Aplicando promoción a ${preview?.totalItems} variantes...`
      : "Aplicando promoción...";

  return (
    <Modal
      title="Promociones de la publicación"
      open={open}
      onCancel={closeSafely}
      footer={null}
      closable={!submission.loading}
      maskClosable={!submission.loading}
      keyboard={!submission.loading}
    >
      {submission.loading ? (
        <OperationSpinner text={applyingText} />
      ) : partial ? (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <PromotionExecutionStatus result={partial} operation="apply" />
          <Button onClick={onClose}>Cerrar</Button>
        </Space>
      ) : selected ? (
        <SelectedPromotion
          option={selected}
          preview={preview}
          previewLoading={previewLoading}
          failure={failure}
          onBack={resetSelection}
          onConfirm={() => void confirmApplication()}
        />
      ) : (
        <OptionsList
          row={row}
          options={options}
          state={optionsState}
          onSelect={(option) => void loadPreview(option)}
        />
      )}
    </Modal>
  );
}

function SelectedPromotion({
  option,
  preview,
  previewLoading,
  failure,
  onBack,
  onConfirm,
}: Readonly<{
  option: PromotionOption;
  preview: PublicationPromotionPreview | null;
  previewLoading: boolean;
  failure: PromotionActionFailure | null;
  onBack: () => void;
  onConfirm: () => void;
}>) {
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Title level={5}>{displayName(option)}</Typography.Title>
      <PromotionFinancialSummary option={option} />
      {previewLoading ? (
        <Spin tip="Consultando disponibilidad en todas las variantes..." />
      ) : null}
      {failure ? <OperationError failure={failure} /> : null}
      {preview ? (
        <PromotionPreview
          preview={preview}
          onBack={onBack}
          onConfirm={onConfirm}
        />
      ) : !previewLoading ? (
        <Button onClick={onBack}>Volver</Button>
      ) : null}
    </Space>
  );
}

function OptionsList({
  row,
  options,
  state,
  onSelect,
}: Readonly<{
  row: PromotionRow | null;
  options: readonly PromotionOption[];
  state: OptionsState;
  onSelect: (option: PromotionOption) => void;
}>) {
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {row?.currentPromotion ? (
        <Alert
          type="warning"
          message="Esta publicación ya tiene una promoción activa."
          description="Si elegís otra, primero se quitará la actual."
        />
      ) : null}
      {state === "loading" ? (
        <Spin tip="Consultando promociones disponibles..." />
      ) : null}
      {state === "error" ? (
        <Alert
          type="error"
          message="No se pudieron consultar las promociones disponibles."
        />
      ) : null}
      {state === "success" && options.length === 0 ? (
        <Typography.Text>No hay promociones disponibles.</Typography.Text>
      ) : null}
      {state === "success"
        ? options.map((option, index) => (
            <Card
              key={option.id ?? `${option.type ?? "promotion"}-${index}`}
              title={displayName(option)}
              size="small"
            >
              <PromotionFinancialSummary option={option} />
              {option.canApply ? (
                <Button type="primary" onClick={() => onSelect(option)}>
                  Consultar disponibilidad
                </Button>
              ) : (
                <Typography.Text type="secondary">
                  Esta promoción todavía no puede aplicarse desde el panel.
                </Typography.Text>
              )}
            </Card>
          ))
        : null}
    </Space>
  );
}

function OperationSpinner({ text }: Readonly<{ text: string }>) {
  return (
    <Space direction="vertical" align="center" style={{ width: "100%" }}>
      <Spin size="large" />
      <Typography.Text>{text}</Typography.Text>
    </Space>
  );
}

function OperationError({ failure }: Readonly<{ failure: PromotionActionFailure }>) {
  return (
    <Alert
      type="error"
      showIcon
      message={failure.message}
      description={
        failure.diagnosticCode
          ? `Referencia técnica: ${failure.diagnosticCode}`
          : undefined
      }
    />
  );
}

function displayName(option: PromotionOption): string {
  const names: Readonly<Record<string, string>> = {
    PRICE_DISCOUNT: "Descuento en el precio",
    DEAL: "Oferta especial",
    SELLER_CAMPAIGN: "Campaña de Mercado Libre",
    SMART: "Promoción de Mercado Libre",
  };
  return option.name ?? names[option.type?.toUpperCase() ?? ""] ?? "Promoción disponible";
}
