"use client";

import { ReloadOutlined } from "@ant-design/icons";
import { Button, Segmented, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { syncSalesAction } from "./sync-sales.action";

export type SalesFilter =
  | "ALL"
  | "MERCADOLIBRE"
  | "TIENDANUBE"
  | "DIFFERENCES";

type Props = Readonly<{
  value: SalesFilter;
  onChange: (value: SalesFilter) => void;
}>;

export function SalesToolbar({ value, onChange }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const refresh = () => {
    setError(false);

    startTransition(async () => {
      try {
        const result = await syncSalesAction(24);

        messageApi.success(
          `ML: ${result.mercadoLibre.found} encontradas · ${result.mercadoLibre.processed} procesadas · ${result.mercadoLibre.failed} fallidas`,
        );

        router.refresh();
      } catch {
        setError(true);
      }
    });
  };

  return (
    <>
      {contextHolder}

      <div style={{ display: "grid", gap: 8 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <Segmented
            value={value}
            onChange={(next) => onChange(next as SalesFilter)}
            options={[
              { label: "Todas", value: "ALL" },
              { label: "Mercado Libre", value: "MERCADOLIBRE" },
              { label: "Tienda Nube", value: "TIENDANUBE" },
              { label: "Diferencias", value: "DIFFERENCES" },
            ]}
          />

          <Button
            icon={<ReloadOutlined />}
            loading={pending}
            onClick={refresh}
          >
            Actualizar
          </Button>
        </div>

        {error && (
          <Typography.Text type="danger">
            No se pudieron sincronizar las ventas.
          </Typography.Text>
        )}
      </div>
    </>
  );
}
