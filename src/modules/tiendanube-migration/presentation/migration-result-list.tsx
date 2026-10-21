import { Empty, Pagination, Space, Typography } from "antd";
import type { TiendanubeMigrationOutcome, TiendanubeMigrationResultsPage } from "../domain/tiendanube-migration.model";
import { MigrationResultCard } from "./migration-result-card";

type Props = Readonly<{ outcome: TiendanubeMigrationOutcome; page: TiendanubeMigrationResultsPage | null; onPageChange(page: number): void }>;

export function MigrationResultList({ outcome, page, onPageChange }: Props) {
  const approved = outcome === "APPROVED";
  const title = approved ? "Aprobados" : "Rechazados";
  return <section aria-label={title}>
    <Typography.Title level={3} type={approved ? "success" : "danger"}>{title}</Typography.Title>
    {!page || page.items.length === 0 ? <Empty description={`Sin productos ${title.toLowerCase()}.`} image={Empty.PRESENTED_IMAGE_SIMPLE} /> : <Space direction="vertical" size="middle" style={{ width: "100%" }}>{page.items.map((result) => <MigrationResultCard key={result.id} outcome={outcome} result={result} />)}</Space>}
    {page && page.total > page.limit ? <Pagination current={page.page} pageSize={page.limit} showSizeChanger={false} total={page.total} onChange={(nextPage) => onPageChange(nextPage)} /> : null}
  </section>;
}
