import { Progress, Typography } from "antd";
import type { TiendanubeMigrationProgress } from "../domain/tiendanube-migration.model";

type Props = Readonly<{ progress: TiendanubeMigrationProgress | null }>;

export function MigrationCircularProgress({ progress }: Props) {
  const isCompleted = progress?.status === "COMPLETED" || progress?.status === "COMPLETED_WITH_REJECTIONS";
  const total = progress?.totalItems ?? 0;
  const percent = total > 0 && progress ? Math.min(100, Math.max(0, Math.round(progress.processedItems / total * 100))) : 0;
  const discovering = progress?.status === "DISCOVERING" && total === 0;

  return <div>
    <Progress format={() => discovering ? "Preparando" : `${isCompleted ? 100 : percent}%`} percent={isCompleted ? 100 : percent} size={230} status={progress?.status === "PAUSED" ? "exception" : "normal"} strokeColor={isCompleted ? "#52c41a" : "#1677ff"} type="circle" />
    {discovering ? <Typography.Paragraph type="secondary">Descubriendo el catálogo…</Typography.Paragraph> : null}
  </div>;
}
