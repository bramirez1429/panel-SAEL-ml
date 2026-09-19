import { Card, Statistic } from 'antd';
import type { ProductRankingResponse } from '../domain/product-ranking.model';
import { ProductRankingTable } from './product-ranking-table.client';
import styles from './product-ranking-view.module.css';
import type { LoadProductRankingVariantsAction } from '@/app/(dashboard)/ranking-productos/load-product-ranking-variants.action';

export function ProductRankingView({ data, error, loadVariantsAction }: { data?: ProductRankingResponse; error?: boolean; loadVariantsAction?: LoadProductRankingVariantsAction }) {
  return <main className={styles.page}><header className={styles.header}><div><h2 className={styles.title}>Ranking de productos</h2><p className={styles.description}>Productos con más ventas acumuladas en Mercado Libre.</p></div></header>
    {data && <div className={styles.summary}><Card><Statistic title="Productos totales" value={data.totalProducts} /></Card><Card><Statistic title="Productos con ventas" value={data.productsWithSales} /></Card></div>}
    <Card title="Productos más vendidos"><ProductRankingTable data={data} error={error} loadVariantsAction={loadVariantsAction} /></Card></main>;
}
