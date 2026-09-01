"use client";

import { Button, List, Modal, Space, Typography } from "antd";
import { useState } from "react";

import { PromotionBulkApplicationModal } from "./promotion-bulk-application-modal.client";
import type { SelectedPromotion } from "./promotion-global.store";
import { usePromotionGlobalStore } from "./promotion-global.store";

type Props = Readonly<{ reviewOnly?: boolean }>;

export function PromotionSelectionSummary({ reviewOnly = false }: Props) {
  const [open, setOpen] = useState(false);
  const [reviewSelections, setReviewSelections] = useState<readonly SelectedPromotion[]>([]);
  const selectionsByKey = usePromotionGlobalStore((state) => state.selections);
  const selections = Object.values(selectionsByKey);

  function openReview(): void {
    setReviewSelections(selections);
    setOpen(true);
  }

  if (selections.length === 0 && !open) return null;

  return <>
    {selections.length > 0 ? <Space style={{ marginBottom: 16 }}>
      <Typography.Text strong>{selections.length} {selections.length === 1 ? "promoción seleccionada" : "promociones seleccionadas"}</Typography.Text>
      <Button type="primary" onClick={openReview}>Participar en las seleccionadas</Button>
    </Space> : null}
    {reviewOnly ? <Modal
      cancelButtonProps={{ style: { display: "none" } }}
      okText="Cerrar"
      onCancel={() => setOpen(false)}
      onOk={() => setOpen(false)}
      open={open}
      title="Promociones seleccionadas"
    >
      <List
        dataSource={[...reviewSelections]}
        renderItem={(selection) => (
          <List.Item>
            <Space orientation="vertical" size={0}>
              <Typography.Text strong>{selection.option.name ?? "Promoción de Mercado Libre"}</Typography.Text>
              <Typography.Text type="secondary">
                {selection.publicationTitle} · {selection.itemId}
              </Typography.Text>
            </Space>
          </List.Item>
        )}
      />
    </Modal> : open ? (
      <PromotionBulkApplicationModal
        onClose={() => setOpen(false)}
        selections={reviewSelections}
      />
    ) : null}
  </>;
}
