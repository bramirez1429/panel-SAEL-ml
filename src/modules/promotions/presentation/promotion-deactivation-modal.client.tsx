"use client";

import { Alert, Button, Modal, Space, Spin, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PromotionActionFailure } from "../domain/promotion-action.model";
import type { PromotionRow } from "../domain/promotion.model";
import type { PromotionOption } from "../domain/promotions.repository";
import { deactivateSelectedPromotion } from "./deactivate-selected-promotion.action";
import { usePromotionGlobalStore } from "./promotion-global.store";
import { useSingleSubmission } from "./use-single-submission.client";

export type PromotionDeactivationSelection = Readonly<{
  publication: PromotionRow;
  option: PromotionOption;
}>;

type Props = Readonly<{
  selection: PromotionDeactivationSelection | null;
  open: boolean;
  onClose: () => void;
}>;

export function PromotionDeactivationModal({ selection, open, onClose }: Props) {
  const router = useRouter();
  const submission = useSingleSubmission();
  const [failure, setFailure] = useState<PromotionActionFailure | null>(null);
  const invalidateOptions = usePromotionGlobalStore((state) => state.invalidateOptions);

  async function confirm(): Promise<void> {
    if (!selection) return;
    setFailure(null);
    const attempt = await submission.run(() => deactivateSelectedPromotion({
      itemId: selection.publication.itemId,
      option: selection.option,
    }));
    if (!attempt.started) return;
    if (!attempt.value.ok) {
      setFailure(attempt.value);
      return;
    }

    invalidateOptions([selection.publication.itemId]);
    router.refresh();
    onClose();
    message.success("Dejaste de participar de la promoción.");
  }

  const closeSafely = () => {
    if (!submission.loading) onClose();
  };

  return <Modal
    title="Dejar de participar"
    open={open}
    onCancel={closeSafely}
    footer={null}
    closable={!submission.loading}
    maskClosable={!submission.loading}
    keyboard={!submission.loading}
  >
    {submission.loading
      ? <Space direction="vertical" align="center" style={{ width: "100%" }}>
        <Spin size="large" />
        <Typography.Text>Dejando de participar...</Typography.Text>
      </Space>
      : <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Typography.Text strong>{selection?.option.name ?? "Promoción de Mercado Libre"}</Typography.Text>
          <br />
          <Typography.Text type="secondary">{selection?.publication.itemId}</Typography.Text>
        </div>
        <Alert
          type="warning"
          showIcon
          message="Se quitará únicamente esta promoción de esta publicación."
          description={selection?.option.status === "pending"
            ? "Se cancelará la participación programada."
            : "Se quitará la publicación de esta promoción activa."}
        />
        {failure ? <Alert
          type="error"
          showIcon
          message={failure.message}
          description={failure.diagnosticCode
            ? `Referencia técnica: ${failure.diagnosticCode}`
            : undefined}
        /> : null}
        <Space>
          <Button onClick={onClose}>Cancelar</Button>
          <Button danger type="primary" onClick={() => void confirm()}>
            {failure ? "Reintentar" : "Dejar de participar"}
          </Button>
        </Space>
      </Space>}
  </Modal>;
}
