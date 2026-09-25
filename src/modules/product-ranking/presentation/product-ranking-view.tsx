import { Card, Statistic } from 'antd';

import type { LoadProductRankingVariantsAction } from '@/app/(dashboard)/ranking-productos/load-product-ranking-variants.action';
import type { ProductRankingResponse } from '../domain/product-ranking.model';
import {
  DEFAULT_PRODUCT_RANKING_VISIT_PERIOD,
  type ProductRankingVisitPeriod,
} from '../domain/product-ranking-period';
import { ProductRankingTable } from './product-ranking-table.client';
import styles from './product-ranking-view.module.css';
import { VisitPeriodSelect } from './visit-period-select.client';

type Props = Readonly<{
  data?: ProductRankingResponse;
  error?: boolean;
  loadVariantsAction?: LoadProductRankingVariantsAction;
  visitPeriodDays?: ProductRankingVisitPeriod;
}>;

const numberFormatter = new Intl.NumberFormat('es-AR');
const formatNumber = (value: number) => numberFormatter.format(value);

export function ProductRankingView({
  data,
  error,
  loadVariantsAction,
  visitPeriodDays,
}: Props) {
  const currentPeriod = (data?.visitPeriodDays ??
    visitPeriodDays ??
    DEFAULT_PRODUCT_RANKING_VISIT_PERIOD) as ProductRankingVisitPeriod;
  const totalVisitsDisplay = data?.totalVisits === null || data?.totalVisits === undefined
    ? '—'
    : formatNumber(data.totalVisits);

  return <main className={styles.page}>
    <header className={styles.header}>
      <div>
        <h2 className={styles.title}>Ranking de productos</h2>
        <p className={styles.description}>
          Productos con más ventas acumuladas en Mercado Libre.
        </p>
      </div>
      <div className={styles.periodControl}>
        <VisitPeriodSelect value={currentPeriod} />
      </div>
    </header>
    {data ? <div className={styles.summary}>
      <Card><Statistic title="Productos totales" value={data.totalProducts} /></Card>
      <Card><Statistic title="Productos con ventas" value={data.productsWithSales} /></Card>
      <Card>
        <Statistic
          title="Visitas totales"
          value={totalVisitsDisplay}
        />
        <span className={styles.summaryPeriod}>{`Últimos ${data.visitPeriodDays} días`}</span>
      </Card>
    </div> : null}
    <Card title="Productos más vendidos">
      <ProductRankingTable
        data={data}
        error={error}
        loadVariantsAction={loadVariantsAction}
      />
    </Card>
  </main>;
}
