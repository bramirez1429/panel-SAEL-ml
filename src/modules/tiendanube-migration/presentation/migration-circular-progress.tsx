import { Progress, Typography } from "antd";

import type { TiendanubeMigrationProgress } from "../domain/tiendanube-migration.model";

type Props = Readonly<{ progress: TiendanubeMigrationProgress | null }>;

export function MigrationCircularProgress({ progress }: Props) {
  const isCompleted = progress?.status === "COMPLETED";
  const total = progress?.totalProducts;
  const percent = total && total > 0 ? Math.min(100, Math.max(0, Math.round(progress.processedProducts / total * 100))) : 0;
  const format = () => total === null ? "Preparando" : `${percent}%`;

  return <div>
    <Progress format={format} percent={isCompleted ? 100 : percent} size={230} status={progress?.status === "FAILED" ? "exception" : "normal"} strokeColor={isCompleted ? "#52c41a" : "#1677ff"} type="circle" />
    {total === null ? <Typography.Paragraph type="secondary">Descubriendo el catálogo…</Typography.Paragraph> : null}
  </div>;
}
