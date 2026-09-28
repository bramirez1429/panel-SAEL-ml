"use client";

import { Button, Space, Typography } from "antd";
import { useState } from "react";

import { PromotionBulkApplicationModal } from "./promotion-bulk-application-modal.client";
import type { SelectedPromotion } from "./promotion-global.store";
import { usePromotionGlobalStore } from "./promotion-global.store";

export function PromotionSelectionSummary({
  onCompleted,
  selectionKeys,
}: Readonly<{
  onCompleted?: () => void | Promise<void>;
  selectionKeys?: readonly string[];
}> = {}) {
  const [open, setOpen] = useState(false);
  const [reviewSelections, setReviewSelections] = useState<readonly SelectedPromotion[]>([]);
  const selectionsByKey = usePromotionGlobalStore((state) => state.selections);
  const allowedKeys = selectionKeys ? new Set(selectionKeys) : null;
  const selections = Object.values(selectionsByKey).filter(
    ({ key }) => !allowedKeys || allowedKeys.has(key),
  );

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
    {open ? <PromotionBulkApplicationModal selections={reviewSelections} onClose={() => setOpen(false)} onCompleted={onCompleted} /> : null}
  </>;
}
