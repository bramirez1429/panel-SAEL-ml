'use client';

import { useMemo, useState } from 'react';
import { DownOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Image, Input, Select, Skeleton, Space, Spin, Table, Tag, Typography } from 'antd';
import { CopyableText } from '@/shared/ui/copyable-text.client';
import type { LoadProductRankingVariantsAction } from '@/app/(dashboard)/ranking-productos/load-product-ranking-variants.action';
import type { ProductRankingResponse, ProductRankingItem, ProductRankingVariant } from '../domain/product-ranking.model';
import styles from './product-ranking-view.module.css';

type Props = {
  data?: ProductRankingResponse;
  error?: boolean;
  loading?: boolean;
  loadVariantsAction?: LoadProductRankingVariantsAction;
};

type VariantState =
  | { status: 'loading' }
  | { status: 'success'; variants: readonly ProductRankingVariant[] }
  | { status: 'error' };

const formatNumber = (value: number) => new Intl.NumberFormat('es-AR').format(value);
const productKey = (product: ProductRankingItem) => product.familyId ? `family:${product.familyId}` : `item:${product.itemIds[0] ?? product.title}`;

export function ProductRankingTable({ data, error, loading, loadVariantsAction }: Props) {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState<'10' | '20' | '50' | 'all'>('20');
  const [expandedKeys, setExpandedKeys] = useState<readonly string[]>([]);
  const [variantStates, setVariantStates] = useState<Record<string, VariantState>>({});
  const products = data?.products ?? [];
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = normalized ? products.filter((product) => [product.title, ...product.itemIds, product.familyId ?? '', ...product.userProductIds].some((value) => value.toLowerCase().includes(normalized))) : [...products];
    return result.sort((a, b) => b.sold - a.sold);
  }, [products, query]);
  const visible = limit === 'all' ? filtered : filtered.slice(0, Number(limit));

  async function requestVariants(product: ProductRankingItem, key: string) {
    if (!loadVariantsAction) {
      setVariantStates((current) => ({ ...current, [key]: { status: 'error' } }));
      return;
    }
    const target = product.familyId
      ? { type: 'family' as const, id: product.familyId }
      : { type: 'item' as const, id: product.itemIds[0] ?? '' };
    if (!target.id) return;
    setVariantStates((current) => ({ ...current, [key]: { status: 'loading' } }));
    const result = await loadVariantsAction(target);
    setVariantStates((current) => ({ ...current, [key]: result.ok
      ? { status: 'success', variants: [...result.variants].sort((a, b) => b.sold - a.sold || a.label.localeCompare(b.label)) }
      : { status: 'error' } }));
  }

  function toggleVariants(product: ProductRankingItem) {
    if (product.variantsCount === 0) return;
    const key = productKey(product);
    const isOpen = expandedKeys.includes(key);
    setExpandedKeys((current) => isOpen ? current.filter((candidate) => candidate !== key) : [...current, key]);
    if (!isOpen && !variantStates[key]) void requestVariants(product, key);
  }

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (error) return <Alert type="error" title="No se pudo consultar Mercado Libre. Revisá la conexión desde Integraciones." />;
  if (!data || products.length === 0) return <Empty className={styles.empty} description="No se encontraron productos." />;

  const columns = [
    { title: '#', key: 'position', width: 64, render: (_: unknown, __: ProductRankingItem, index: number) => index + 1 },
    { title: 'Producto', key: 'product', render: (_: unknown, product: ProductRankingItem) => <ProductCell product={product} /> },
    { title: 'Vendidos', dataIndex: 'sold', key: 'sold', width: 120, render: (sold: number) => <Typography.Text className={styles.sold} strong>{formatNumber(sold)}</Typography.Text> },
    { title: 'MLA', key: 'mla', width: 210, render: (_: unknown, product: ProductRankingItem) => <MlaSummary product={product} /> },
    { title: 'Variantes', key: 'variants', width: 180, render: (_: unknown, product: ProductRankingItem) => {
      const key = productKey(product);
      const isOpen = expandedKeys.includes(key);
      return product.variantsCount === 0
        ? <Typography.Text type="secondary">Sin variantes</Typography.Text>
        : <Button icon={isOpen ? <DownOutlined /> : <RightOutlined />} onClick={() => toggleVariants(product)}>{isOpen ? 'Ocultar variantes' : `Ver variantes (${product.variantsCount})`}</Button>;
    } },
  ];

  return <div>
    <div className={styles.controls}>
      <Input allowClear prefix={<SearchOutlined />} placeholder="Buscar por nombre, MLA o familia…" value={query} onChange={(event) => setQuery(event.target.value)} style={{ maxWidth: 420 }} />
      <Select value={limit} onChange={setLimit} options={[['10', 'Top 10'], ['20', 'Top 20'], ['50', 'Top 50'], ['all', 'Todos']].map(([value, label]) => ({ value, label }))} />
    </div>
    {visible.length === 0 ? <Empty description="No se encontraron productos." /> : <Table
      className={styles.table}
      rowKey={productKey}
      columns={columns}
      dataSource={visible}
      pagination={false}
      scroll={{ x: 900 }}
      expandable={{
        expandedRowKeys: [...expandedKeys],
        showExpandColumn: false,
        expandedRowRender: (product) => <VariantsPanel
          state={variantStates[productKey(product)]}
          onRetry={() => void requestVariants(product, productKey(product))}
        />,
      }}
    />}
  </div>;
}

function ProductCell({ product }: { product: ProductRankingItem }) {
  return <div className={styles.productCell}>
    {product.thumbnailUrl
      ? <Image alt={`Imagen de ${product.title}`} className={styles.thumbnail} height={64} preview={false} src={product.thumbnailUrl} width={64} />
      : <span className={styles.thumbnailPlaceholder}>—</span>}
    <div className={styles.productDetails}>
      <Typography.Text strong>{product.title}</Typography.Text>
      <Tag className={styles.typeTag}>{product.type}</Tag>
      {product.familyId ? <span className={styles.familyLine}><Typography.Text type="secondary">Familia:</Typography.Text><CopyableText value={product.familyId} label={product.familyId} copyLabel="Family ID" /></span> : null}
    </div>
  </div>;
}

function MlaSummary({ product }: { product: ProductRankingItem }) {
  const first = product.itemIds[0];
  if (!first) return <Typography.Text type="secondary">Sin MLA</Typography.Text>;
  return <Space orientation="vertical" size={1}>
    <CopyableText value={first} label={first} copyLabel="MLA" />
    {product.itemIds.length > 1 ? <Typography.Text type="secondary">+ {product.itemIds.length - 1} más</Typography.Text> : null}
  </Space>;
}

function VariantsPanel({ state, onRetry }: { state?: VariantState; onRetry: () => void }) {
  if (!state || state.status === 'loading') return <div className={styles.variantLoading}><Spin size="small" /><span>Cargando variantes…</span></div>;
  if (state.status === 'error') return <Alert type="error" title="No se pudieron cargar las variantes." action={<Button size="small" onClick={onRetry}>Reintentar</Button>} />;
  if (state.variants.length === 0) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No se encontraron variantes." />;
  const maxSold = Math.max(...state.variants.map(({ sold }) => sold));
  return <div className={styles.variantPanel}>
    <div className={`${styles.variantRow} ${styles.variantHeader}`}><span>Variante</span><span>MLA</span><span>MLAU</span><span>Vendidos</span></div>
    <div className={styles.variantRows}>{state.variants.map((variant) => {
      const bestSeller = maxSold > 0 && variant.sold === maxSold;
      return <div className={styles.variantRow} key={variant.id}>
        <span className={styles.variantIdentity}>
          {variant.thumbnailUrl ? <Image alt={variant.label} height={40} preview={false} src={variant.thumbnailUrl} width={40} /> : null}
          <span><Typography.Text strong>{variant.label}</Typography.Text>{bestSeller ? <Tag color="gold">Más vendida</Tag> : null}</span>
        </span>
        <span>{variant.itemId ? <CopyableText value={variant.itemId} label={variant.itemId} copyLabel="MLA" /> : '—'}</span>
        <span>{variant.userProductId ? <CopyableText value={variant.userProductId} label={variant.userProductId} copyLabel="MLAU" /> : '—'}</span>
        <Typography.Text strong>{formatNumber(variant.sold)}</Typography.Text>
      </div>;
    })}</div>
  </div>;
}

export function ProductRankingLoading() { return <ProductRankingTable loading />; }
