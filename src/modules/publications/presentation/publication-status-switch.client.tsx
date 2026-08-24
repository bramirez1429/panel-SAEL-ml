"use client";

import { message, Space, Switch } from "antd";
import { useState } from "react";
import { useRouter } from "next/navigation";

import type { PublicationEditStatus, PublicationEditTarget } from "../domain/publication-edit.repository";
import { PublicationStatus } from "./publication-status";

export type PublicationStatusUpdateAction = (input: Readonly<{
  publicationId: string;
  target: PublicationEditTarget;
  status: PublicationEditStatus;
}>) => Promise<Readonly<{ ok: true; confirmed: PublicationEditStatus } | { ok: false; message: string }>>;

type Props = Readonly<{
  publicationId: string;
  target: PublicationEditTarget;
  initialStatus: string | null;
  action?: PublicationStatusUpdateAction;
  onConfirmed?: (status: PublicationEditStatus) => void;
}>;

/** Isla cliente reutilizable: sólo coordina interacción, no conoce JWT ni HTTP. */
export function PublicationStatusSwitch({ publicationId, target, initialStatus, action, onConfirmed }: Props) {
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [status, setStatus] = useState<PublicationEditStatus | null>(
    initialStatus === "active" || initialStatus === "paused" ? initialStatus : null,
  );
  const router = useRouter();

  if (initialStatus === "closed") {
    return <Space>{contextHolder}<PublicationStatus status="closed" /><Switch checked={false} disabled /></Space>;
  }
  if (!action || status === null) return <PublicationStatus status={initialStatus} />;

  return <Space>{contextHolder}
    <PublicationStatus status={status} />
    <Switch
      checked={status === "active"}
      disabled={saving}
      loading={saving}
      onChange={async (checked) => {
        setSaving(true);
        try {
          const result = await action({ publicationId, target, status: checked ? "active" : "paused" });
          if (result.ok) {
            setStatus(result.confirmed);
            onConfirmed?.(result.confirmed);
            router.refresh();
          } else {
            messageApi.error(result.message);
          }
        } finally {
          setSaving(false);
        }
      }}
    />
  </Space>;
}
