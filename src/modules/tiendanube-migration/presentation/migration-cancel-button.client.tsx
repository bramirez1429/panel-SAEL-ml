"use client";

import { StopOutlined } from "@ant-design/icons";
import { Button, Popconfirm } from "antd";

type Props = Readonly<{
  loading: boolean;
  disabled: boolean;
  onCancel(): void;
}>;

export function MigrationCancelButton({
  loading,
  disabled,
  onCancel,
}: Props) {
  return (
    <Popconfirm
      title="¿Cancelar la migración?"
      description="Se detendrán los productos pendientes. Los ya migrados se conservarán."
      okText="Sí, cancelar migración"
      cancelText="Volver"
      okButtonProps={{ danger: true }}
      onConfirm={onCancel}
    >
      <Button
        danger
        type="primary"
        size="large"
        icon={<StopOutlined />}
        loading={loading}
        disabled={disabled}
      >
        Cancelar migración
      </Button>
    </Popconfirm>
  );
}
