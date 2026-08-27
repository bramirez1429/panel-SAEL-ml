"use client";

import { Alert, Button, Modal, Space, Spin, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PromotionActionFailure } from "../domain/promotion-action.model";
import {
  publicationSourceKey,
  type PublicationPromotionResult,
} from "../domain/publication-promotion.model";
import type { PromotionRow } from "../domain/promotion.model";
import { deactivatePromotion } from "./deactivate-promotion.action";
import { PromotionExecutionStatus } from "./promotion-execution-status";
import { handlePromotionCompletion } from "./promotion-result.handler";
import { useSingleSubmission } from "./use-single-submission.client";

type Props = Readonly<{
  row: PromotionRow | null;
  open: boolean;
  onClose: () => void;
}>;

export function PromotionDeactivationModal({ row, open, onClose }: Props) {
  const router = useRouter();
  const submission = useSingleSubmission();
  const [failure, setFailure] = useState<PromotionActionFailure | null>(null);
  const [partial, setPartial] = useState<PublicationPromotionResult | null>(null);

  async function confirm(): Promise<void> {
    if (!row) return;
    setFailure(null);
    const attempt = await submission.run(() =>
      deactivatePromotion(publicationSourceKey(row)),
    );
    if (!attempt.started) return;
    if (!attempt.value.ok) {
      setFailure(attempt.value);
      return;
    }
    handlePromotionCompletion(
      attempt.value.result,
      "Promoción desactivada en toda la publicación.",
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

  return (
    <Modal
      title="Desactivar promoción"
      open={open}
      onCancel={closeSafely}
      footer={null}
      closable={!submission.loading}
      maskClosable={!submission.loading}
      keyboard={!submission.loading}
    >
      {submission.loading ? (
        <Space direction="vertical" align="center" style={{ width: "100%" }}>
          <Spin size="large" />
          <Typography.Text>Desactivando promoción...</Typography.Text>
        </Space>
      ) : partial ? (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <PromotionExecutionStatus result={partial} operation="deactivate" />
          <Button onClick={onClose}>Cerrar</Button>
        </Space>
      ) : (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Alert
            type="warning"
            showIcon
            message="Se desactivará la promoción en toda la publicación."
            description={
              row?.familyId
                ? "La operación incluirá todas las variantes actuales de la familia."
                : "La operación incluirá el ítem completo y sus variaciones."
            }
          />
          {failure ? (
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
          ) : null}
          <Space>
            <Button onClick={onClose}>Cancelar</Button>
            <Button danger type="primary" onClick={() => void confirm()}>
              Desactivar en toda la publicación
            </Button>
          </Space>
        </Space>
      )}
    </Modal>
  );
}
