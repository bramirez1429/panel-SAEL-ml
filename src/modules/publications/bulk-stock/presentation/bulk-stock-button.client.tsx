"use client";

import { Button } from "antd";
import { useState } from "react";

import type {
  CreateBulkStockJobAction,
  GetBulkStockJobAction,
  PreviewBulkStockAction,
  LoadBulkStockCatalogAction,
  PreviewBulkStockSelectionAction,
} from "../domain/bulk-stock.model";
import { BulkStockModal } from "./bulk-stock-modal.client";

export function BulkStockButton({
  previewAction,
  catalogAction,
  selectionPreviewAction,
  createJobAction,
  getJobAction,
}: Readonly<{
  previewAction: PreviewBulkStockAction;
  catalogAction: LoadBulkStockCatalogAction;
  selectionPreviewAction: PreviewBulkStockSelectionAction;
  createJobAction: CreateBulkStockJobAction;
  getJobAction: GetBulkStockJobAction;
}>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} type="primary">
        Cambiar stock masivamente
      </Button>
      <BulkStockModal
        createJobAction={createJobAction}
        getJobAction={getJobAction}
        open={open}
        previewAction={previewAction}
        catalogAction={catalogAction}
        selectionPreviewAction={selectionPreviewAction}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
