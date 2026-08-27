"use client";

import { Alert, Button, Space } from "antd";

import {
  previewAllowsApplication,
  type PublicationPromotionPreview,
} from "../domain/publication-promotion.model";

type Props = Readonly<{
  preview: PublicationPromotionPreview;
  onConfirm: () => void;
  onBack: () => void;
}>;

export function PromotionPreview({ preview, onConfirm, onBack }: Props) {
  const canApply = previewAllowsApplication(preview);
  const message = canApply
    ? `Esta promoción se aplicará a ${preview.totalItems} variantes.`
    : `Disponible para ${preview.applicableItems} de ${preview.totalItems} variantes.`;
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Alert
        type={canApply ? "info" : "warning"}
        showIcon
        message={message}
        description={
          canApply
            ? "Mercado Libre volverá a validar cada variante al confirmar."
            : "Esta promoción no está disponible para todas las variantes. No se realizará ningún cambio."
        }
      />
      <Space>
        <Button onClick={onBack}>Volver</Button>
        {canApply ? (
          <Button type="primary" onClick={onConfirm}>
            Aplicar a toda la publicación
          </Button>
        ) : null}
      </Space>
    </Space>
  );
}
