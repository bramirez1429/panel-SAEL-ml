"use client";

import { Button } from "antd";
import { useState } from "react";

import type {
  CreateBulkStockJobAction,
  GetBulkStockJobAction,
  PreviewBulkStockAction,
} from "../domain/bulk-stock.model";
import { BulkStockModal } from "./bulk-stock-modal.client";

export function BulkStockButton({
  previewAction,
  createJobAction,
  getJobAction,
}: Readonly<{
  previewAction: PreviewBulkStockAction;
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
        onClose={() => setOpen(false)}
      />
    </>
  );
}
