"use client";

import { DownOutlined, SearchOutlined, UpOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Image, Input, Pagination, Skeleton, Space, Table, Tag, Typography } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { TiendanubeProduct, TiendanubeProductsPage, TiendanubeProductVariant } from "../domain/tiendanube-products.model";
import styles from "./tiendanube-products-page.module.css";

const PRODUCT_PAGE_SIZE = 20;
const INITIAL_VARIANTS = 3;

type Props = Readonly<{
  page: TiendanubeProductsPage | null;
  activeSearch: string;
  errorMessage?: string | null;
}>;

export function TiendanubeProductsPageClient({ page, activeSearch, errorMessage = null }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(activeSearch);
  const [expandedProductIds, setExpandedProductIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    setSearch(activeSearch);
    setExpandedProductIds(new Set());
  }, [activeSearch, page?.page]);

  function submitSearch(value: string): void {
    const params = new URLSearchParams(searchParams.toString());
    const nextSearch = value.trim();
    if (nextSearch) params.set("q", nextSearch);
    else params.delete("q");
    params.delete("page");
    navigate(params);
  }

  function navigate(params: URLSearchParams): void {
    const query = params.toString();
    router.push(`/tiendanube/productos${query ? `?${query}` : ""}`);
  }

  function changePage(nextPage: number): void {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage === 1) params.delete("page");
    else params.set("page", String(nextPage));
    navigate(params);
  }

  function toggleProduct(productId: string): void {
    setExpandedProductIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  const products = page?.products ?? [];

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <Typography.Title level={2} className={styles.title}>Tiendanube</Typography.Title>
          <Typography.Text type="secondary">Productos y variantes sincronizados con tu tienda.</Typography.Text>
        </div>
        <Input.Search
          allowClear
          className={styles.search}
          enterButton={<SearchOutlined />}
          onChange={(event) => setSearch(event.target.value)}
          onSearch={submitSearch}
          placeholder="Buscar por nombre, SKU o tags"
          value={search}
        />
      </div>

      {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}
      {!errorMessage && page && products.length === 0 ? <Empty description={activeSearch ? `No se encontraron productos para "${activeSearch}".` : "No hay productos en Tiendanube."} /> : null}
      {!errorMessage && page && products.length > 0 ? (
        <Card className={styles.tableCard}>
          <Table<TiendanubeProduct>
            columns={columns(expandedProductIds, toggleProduct)}
            dataSource={[...products]}
            pagination={false}
            rowKey="id"
            scroll={{ x: 900 }}
            size="middle"
          />
          <div className={styles.pagination}>
            <Pagination
              current={page.page}
              pageSize={PRODUCT_PAGE_SIZE}
              showQuickJumper={false}
              showSizeChanger={false}
              total={page.total}
              onChange={changePage}
            />
          </div>
        </Card>
      ) : null}
    </main>
  );
}

export function TiendanubeProductsSkeleton() {
  return <Card className={styles.tableCard}><Skeleton active paragraph={{ rows: 9 }} /></Card>;
}

function columns(expandedProductIds: ReadonlySet<string>, toggleProduct: (productId: string) => void) {
  return [
    {
      key: "product",
      title: "Producto",
      render: (_value: unknown, product: TiendanubeProduct) => (
        <div className={styles.productCell}>
          {product.imageUrl ? <Image alt={product.name} className={styles.productImage} preview={false} src={product.imageUrl} /> : <div className={styles.productImagePlaceholder} />}
          <Typography.Text strong ellipsis={{ tooltip: product.name }}>{product.name}</Typography.Text>
        </div>
      ),
    },
    {
      key: "status",
      title: "Estado",
      render: (_value: unknown, product: TiendanubeProduct) => <Tag>{product.status}</Tag>,
    },
    {
      key: "tags",
      title: "Tags",
      render: (_value: unknown, product: TiendanubeProduct) => product.tags.length > 0
        ? <Space size={[4, 4]} wrap>{product.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
        : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      key: "variants",
      title: "Variantes",
      render: (_value: unknown, product: TiendanubeProduct) => (
        <VariantList
          expanded={expandedProductIds.has(product.id)}
          onToggle={() => toggleProduct(product.id)}
          variants={product.variants}
        />
      ),
    },
  ];
}

function VariantList({ variants, expanded, onToggle }: Readonly<{
  variants: readonly TiendanubeProductVariant[];
  expanded: boolean;
  onToggle(): void;
}>) {
  const visibleVariants = expanded ? variants : variants.slice(0, INITIAL_VARIANTS);
  return (
    <div className={styles.variantList}>
      {visibleVariants.length > 0 ? <div className={styles.variantGrid}>
        <Typography.Text type="secondary">Talle / color</Typography.Text>
        <Typography.Text type="secondary">SKU</Typography.Text>
        <Typography.Text type="secondary">Stock</Typography.Text>
        <Typography.Text type="secondary">Precio</Typography.Text>
        <Typography.Text type="secondary">Promoción</Typography.Text>
        {visibleVariants.map((variant) => <VariantRow key={variant.id} variant={variant} />)}
      </div> : <Typography.Text type="secondary">Sin variantes</Typography.Text>}
      {variants.length > INITIAL_VARIANTS ? <Button className={styles.expandButton} icon={expanded ? <UpOutlined /> : <DownOutlined />} onClick={onToggle} size="small" type="link">{expanded ? "Ver menos variantes" : "Ver más variantes"}</Button> : null}
    </div>
  );
}

function VariantRow({ variant }: Readonly<{ variant: TiendanubeProductVariant }>) {
  return <>
    <Typography.Text>{variantLabel(variant)}</Typography.Text>
    <Typography.Text>{variant.sku ?? "—"}</Typography.Text>
    <Typography.Text>{variant.stock === null ? "—" : formatNumber(variant.stock)}</Typography.Text>
    <Typography.Text>{formatPrice(variant.price)}</Typography.Text>
    <Typography.Text>{formatPrice(variant.promotionalPrice)}</Typography.Text>
  </>;
}

function variantLabel(variant: TiendanubeProductVariant): string {
  const values = [variant.size, variant.color].filter((value): value is string => Boolean(value));
  return values.length > 0 ? values.join(" / ") : "—";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-AR").format(value);
}

function formatPrice(value: number | null): string {
  return value === null ? "—" : formatNumber(value);
}
