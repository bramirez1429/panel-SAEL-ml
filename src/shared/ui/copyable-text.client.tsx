"use client";

import { CopyOutlined } from "@ant-design/icons";
import { Button, message, Space, Typography } from "antd";
import type { MouseEvent } from "react";

type Props = Readonly<{ value: string; label: string; copyLabel: string; successMessage?: string }>;

export function CopyableText({ value, label, copyLabel, successMessage = "Copiado" }: Props) {
  async function copy(event: MouseEvent<HTMLElement>): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      message.success(successMessage);
    } catch {
      message.error("No se pudo copiar el valor.");
    }
  }

  return <Space size={2}><Typography.Text>{label}</Typography.Text><Button type="text" size="small" icon={<CopyOutlined />} aria-label={`Copiar ${copyLabel} ${value}`} onClick={(event) => void copy(event)} /></Space>;
}
