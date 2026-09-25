import { Progress, Space, Typography } from "antd";

import { calculateSyncPercent } from "../application/sync-progress";
import type { SyncJob } from "../domain/sync.model";

export function SyncCircularProgress({ job }: Readonly<{ job: SyncJob }>) {
  const percent = calculateSyncPercent(job.processedItems, job.totalItems);
  const completed = job.status === "COMPLETED" || job.status === "COMPLETED_WITH_ERRORS";

  return (
    <Space align="center" size={20} wrap>
      <Progress
        percent={percent}
        size={128}
        status={job.status === "FAILED" ? "exception" : completed ? "success" : "active"}
        steps={20}
        strokeColor={job.status === "COMPLETED_WITH_ERRORS" ? "#faad14" : undefined}
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
