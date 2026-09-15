"use client";

import { Alert, Button, Spin } from "antd";
import { useState } from "react";

import type { SaleVariantsResponse } from "../domain/sales.model";
import { loadSaleVariantsAction } from "./load-sale-variants.action";
import { SaleVariantsTable } from "./sale-variants-table";

type Props = Readonly<{
  saleId: string;
}>;

export function SaleVariants({ saleId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<SaleVariantsResponse | null>(null);
  const [error, setError] = useState(false);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);

    if (detail) return;

    setLoading(true);
    setError(false);

    try {
      setDetail(await loadSaleVariantsAction(saleId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Button onClick={toggle}>
        {open ? "Ocultar talles" : "Ver todos los talles"}
      </Button>

      {open && loading && (
        <div style={{ padding: 24 }}>
          <Spin />
        </div>
      )}

      {open && error && (
        <Alert
          message="No se pudieron cargar los talles."
          showIcon
          style={{ marginTop: 12 }}
          type="error"
        />
      )}

      {open && detail && (
        <div style={{ marginTop: 16 }}>
          <SaleVariantsTable detail={detail} />
        </div>
      )}
    </div>
  );
}

