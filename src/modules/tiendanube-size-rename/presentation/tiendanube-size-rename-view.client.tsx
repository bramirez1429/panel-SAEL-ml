"use client";

import {
  Alert,
  Button,
  Card,
  Image,
  Input,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { useMemo, useRef, useState } from "react";

import type {
  TiendanubeProduct,
  TiendanubeProductVariant,
} from "@/modules/tiendanube/domain/tiendanube-products.model";
import type { LoadSizeCatalogResult } from "@/app/(dashboard)/tiendanube/talles-masivos/actions";
import {
  availableSizes,
  previewSizeChanges,
  type SizeRenameChange,
  type SizeRenameMapping,
} from "../domain/size-rename-preview";

type Props = Readonly<{
  loadPageAction(search: string, page: number): Promise<LoadSizeCatalogResult>;
}>;

const PRODUCT_PAGE_LIMIT = 200;

const variantColumns: TableColumnsType<TiendanubeProductVariant> = [
  { title: "Talle actual", dataIndex: "size", key: "size", render: (value: string | null) => value || "Sin talle" },
  { title: "Color", dataIndex: "color", key: "color", render: (value: string | null) => value || "—" },
  { title: "SKU", dataIndex: "sku", key: "sku", render: (value: string | null) => value || "—" },
  { title: "Stock", dataIndex: "stock", key: "stock", render: (value: number | null) => value ?? "—" },
];

const previewColumns: TableColumnsType<SizeRenameChange> = [
  { title: "Producto", dataIndex: "productName", key: "productName" },
  { title: "SKU", dataIndex: "sku", key: "sku", render: (value: string | null) => value || "—" },
  { title: "Color", dataIndex: "color", key: "color", render: (value: string | null) => value || "—" },
  { title: "Talle actual", dataIndex: "oldSize", key: "oldSize" },
  { title: "Talle propuesto", dataIndex: "newSize", key: "newSize" },
];

function mergeCatalog(
  current: readonly TiendanubeProduct[],
  incoming: readonly TiendanubeProduct[],
): TiendanubeProduct[] {
  const byId = new Map(current.map((product) => [product.id, product]));
  for (const product of incoming) byId.set(product.id, product);
  return [...byId.values()];
}

export function TiendanubeSizeRenameView({ loadPageAction }: Props) {
  const [query, setQuery] = useState("buzo");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [products, setProducts] = useState<readonly TiendanubeProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [mapping, setMapping] = useState<SizeRenameMapping>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const requestVersion = useRef(0);

  const selectedProducts = useMemo(() => {
    const ids = new Set(selectedIds);
    return products.filter((product) => ids.has(product.id));
  }, [products, selectedIds]);
  const sizes = useMemo(() => availableSizes(selectedProducts), [selectedProducts]);
  const preview = useMemo(
    () => previewSizeChanges(selectedProducts, mapping),
    [selectedProducts, mapping],
  );

  async function fetchPage(search: string, nextPage: number, reset: boolean) {
    const term = search.trim();
    if (term.length < 2) {
      setError("Escribí al menos 2 caracteres para buscar.");
      return;
    }
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    setShowPreview(false);

    if (reset) {
      setProducts([]);
      setSelectedIds([]);
      setMapping({});
      setPage(0);
      setHasMore(false);
      setSearchedQuery(term);
    }

    try {
      const response = await loadPageAction(term, nextPage);
      if (version !== requestVersion.current) return;
      if (!response.ok) {
        setError(response.message);
        return;
      }

      setProducts((current) =>
        reset ? [...response.data.products] : mergeCatalog(current, response.data.products),
      );
      setPage(nextPage);
      setHasMore(response.data.hasMore && nextPage < PRODUCT_PAGE_LIMIT);
    } catch {
      if (version === requestVersion.current) {
        setError("No pudimos cargar los productos. Intentá nuevamente.");
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  const productColumns: TableColumnsType<TiendanubeProduct> = [
    {
      title: "Producto",
      key: "name",
      render: (_value, product) => (
        <Space align="center">
          {product.imageUrl ? (
            <Image alt={product.name} src={product.imageUrl} width={52} height={52}
              style={{ objectFit: "contain", borderRadius: 6 }} preview={false} />
          ) : null}
          <div>
            <Typography.Text strong>{product.name}</Typography.Text>
            <div><Typography.Text type="secondary">ID: {product.id}</Typography.Text></div>
          </div>
        </Space>
      ),
    },
    {
      title: "Talles existentes",
      key: "sizes",
      render: (_value, product) => (
        <Space size={[4, 4]} wrap>
          {availableSizes([product]).map((size) => <Tag key={size}>{size}</Tag>)}
          {availableSizes([product]).length === 0 ? <Typography.Text type="secondary">Sin talle</Typography.Text> : null}
        </Space>
      ),
    },
    { title: "Variantes", key: "count", render: (_value, product) => product.variants.length },
  ];

  function changeMapping(size: string, next: string) {
    setMapping((current) => ({ ...current, [size]: next }));
    setShowPreview(false);
  }

  return (
    <main style={{ display: "grid", gap: 20, width: "100%" }}>
      <header>
        <Typography.Title level={2}>Tiendanube — Talles masivos</Typography.Title>
        <Typography.Text type="secondary">
          Buscá buzos, seleccioná los productos y prepará equivalencias de talles para todas sus variantes.
        </Typography.Text>
      </header>

      <Alert
        type="info"
        showIcon
        message="Etapa 1 — Solo lectura y simulación"
        description="Esta pantalla consulta Tiendanube, pero no guarda cambios. Los SKU, precios, stock y colores permanecen intactos."
      />

      <Card title="Buscar productos en Tiendanube">
        <Input.Search
          allowClear
          enterButton="Buscar"
          loading={loading}
          aria-label="Buscar productos de Tiendanube"
          placeholder="Ejemplo: buzo"
          size="large"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onSearch={(value) => void fetchPage(value, 1, true)}
        />
        {error ? <Alert style={{ marginTop: 12 }} message={error} showIcon type="error" /> : null}
      </Card>

      {searchedQuery ? (
        <Card
          title={"Resultados de la búsqueda: " + searchedQuery}
          extra={<Typography.Text type="secondary">{products.length} productos cargados</Typography.Text>}
        >
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Space wrap>
              <Button disabled={products.length === 0 || loading}
                onClick={() => { setSelectedIds(products.map((product) => product.id)); setShowPreview(false); }}>
                Seleccionar todos los cargados
              </Button>
              <Button disabled={selectedIds.length === 0}
                onClick={() => { setSelectedIds([]); setShowPreview(false); }}>
                Quitar selección
              </Button>
              <Typography.Text>{selectedProducts.length} productos seleccionados</Typography.Text>
            </Space>

            <Table<TiendanubeProduct>
              rowKey="id"
              size="small"
              loading={loading && page === 0}
              dataSource={[...products]}
              columns={productColumns}
              rowSelection={{
                selectedRowKeys: [...selectedIds],
                onChange: (keys) => {
                  setSelectedIds(keys.map(String));
                  setShowPreview(false);
                },
              }}
              expandable={{
                expandedRowRender: (product) => (
                  <Table<TiendanubeProductVariant>
                    dataSource={[...product.variants]}
                    columns={variantColumns}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 600 }}
                    size="small"
                  />
                ),
                rowExpandable: (product) => product.variants.length > 0,
              }}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: 760 }}
              locale={{ emptyText: loading ? "Cargando..." : "No encontramos productos con esta búsqueda." }}
            />

            {hasMore ? (
              <Space orientation="vertical">
                <Alert type="warning" showIcon message="Hay más páginas por cargar. Los cambios globales se aplican solamente a los productos que selecciones." />
                <Button disabled={loading} loading={loading}
                  onClick={() => void fetchPage(searchedQuery, page + 1, false)}>
                  Cargar más productos
                </Button>
              </Space>
            ) : null}
          </Space>
        </Card>
      ) : null}

      {selectedProducts.length > 0 ? (
        <Card title="Equivalencias globales de talles">
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Typography.Text type="secondary">
              Se detectaron {sizes.length} talles diferentes en los productos seleccionados.
              Cambiá únicamente los nombres que quieras modificar.
            </Typography.Text>
            {sizes.length === 0 ? (
              <Alert type="warning" message="Los productos seleccionados no tienen el atributo Talle. No se inventarán talles." />
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {sizes.map((size) => (
                  <div key={size} style={{
                    display: "grid", gridTemplateColumns: "minmax(100px, 180px) minmax(180px, 340px)",
                    gap: 12, alignItems: "center",
                  }}>
                    <Typography.Text strong>{"Actual: " + size}</Typography.Text>
                    <Input
                      aria-label={"Nuevo talle para " + size}
                      value={mapping[size] ?? size}
                      maxLength={40}
                      onChange={(event) => changeMapping(size, event.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
            <Button type="primary" disabled={sizes.length === 0 || loading} onClick={() => setShowPreview(true)}>
              Previsualizar cambios de talles
            </Button>
          </Space>
        </Card>
      ) : null}

      {showPreview ? (
        <Card title="Vista previa — Sin aplicar cambios">
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              <Statistic title="Productos seleccionados" value={preview.selectedProducts} />
              <Statistic title="Variantes revisadas" value={preview.selectedVariants} />
              <Statistic title="Talles a cambiar" value={preview.changes.length} />
            </div>
            {preview.warnings.map((warning) => (
              <Alert key={warning} type="error" showIcon message={warning} />
            ))}
            {preview.changes.length === 0 ? (
              <Alert type="info" showIcon message="Todavía no definiste cambios de talle." />
            ) : (
              <Table<SizeRenameChange>
                dataSource={[...preview.changes]}
                columns={previewColumns}
                rowKey="variantId"
                pagination={{ pageSize: 20, showSizeChanger: false }}
                size="small"
                scroll={{ x: 760 }}
              />
            )}
            <Alert type="info" showIcon
              message="Simulación solamente: no se modificó ningún producto."
              description="La escritura real en Tiendanube se incorporará en otra etapa, con validación y confirmación explícita."
            />
          </Space>
        </Card>
      ) : null}
    </main>
  );
}
