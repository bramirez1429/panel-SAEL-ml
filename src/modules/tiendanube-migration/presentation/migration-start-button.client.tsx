"use client";

import { SyncOutlined } from "@ant-design/icons";
import { Button } from "antd";

type Props = Readonly<{ disabled: boolean; loading: boolean; onStart(): void }>;

export function MigrationStartButton({ disabled, loading, onStart }: Props) {
  return <Button disabled={disabled} icon={<SyncOutlined spin={loading} />} loading={loading} onClick={onStart} size="large" type="primary">
    Migrar todo a Tiendanube
  </Button>;
}
