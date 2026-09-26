import { Progress, Space, Typography } from "antd";

import { calculateSyncPercent } from "../application/sync-progress";
import type { SyncJob } from "../domain/sync.model";

export function getSyncProgressAppearance(status: SyncJob["status"]) {
  const completed = status === "COMPLETED";
  const active = status === "PENDING" || status === "RUNNING";
  return {
    status: status === "FAILED"
      ? "exception" as const
      : completed
        ? "success" as const
        : active
          ? "active" as const
          : "normal" as const,
    strokeColor: completed ? "#52c41a" : "#1677ff",
    railColor: "#d9d9d9",
  };
}

export function SyncCircularProgress({ job }: Readonly<{ job: SyncJob }>) {
  const percent = calculateSyncPercent(job.processedItems, job.totalItems);
  const appearance = getSyncProgressAppearance(job.status);

  return (
    <Space align="center" size={20} wrap>
      <Progress
        percent={percent}
        size={128}
        status={appearance.status}
        steps={20}
        strokeColor={appearance.strokeColor}
        railColor={appearance.railColor}
        type="circle"
      />
      <Space orientation="vertical" size={2}>
        <Typography.Text strong>{job.processedItems} / {job.totalItems}</Typography.Text>
        <Typography.Text type="success">{job.successfulItems} OK</Typography.Text>
        <Typography.Text type={job.failedItems > 0 ? "danger" : "secondary"}>
          {job.failedItems} errores
        </Typography.Text>
      </Space>
    </Space>
  );
}

export function EmptySyncCircularProgress() {
  return (
    <Progress
      percent={0}
      size={128}
      steps={20}
      strokeColor="#1677ff"
      railColor="#d9d9d9"
      type="circle"
    />
  );
}
