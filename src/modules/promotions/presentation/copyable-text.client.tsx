"use client";

import { Button, Space, Typography, message } from "antd";
import type { MouseEvent } from "react";

type Props = Readonly<{
  value: string;
  label: string;
  copyLabel: string;
  successMessage: string;
}>;

export function CopyableText({ value, label, copyLabel, successMessage }: Props) {
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

  return <Space size={2}>
    <Typography.Text type="secondary">{label}</Typography.Text>
    <Button type="text" size="small" aria-label={`Copiar ${copyLabel} ${value}`} onClick={(event) => void copy(event)}>
      <span aria-hidden>⧉</span>
    </Button>
  </Space>;
}
