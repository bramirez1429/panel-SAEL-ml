"use client";

import { SyncOutlined } from "@ant-design/icons";
import { Button } from "antd";

export function SyncNowButton({
  disabled,
  loading,
  onClick,
}: Readonly<{
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}>) {
  return (
    <Button
      disabled={disabled}
      icon={<SyncOutlined spin={loading} />}
      loading={loading}
      type="primary"
      onClick={onClick}
    >
      Sincronizar ahora
    </Button>
  );
}
