"use client";

import { Alert, Button, Form, InputNumber, Select, Spin, Table, Tag, Typography } from "antd";
import type { SelectProps } from "antd";
import { useMemo, useRef, useState } from "react";

import { BULK_STOCK_PRODUCT_TYPE_OPTIONS } from "../bulk-stock.config";
import { distinctBulkStockFilterOptions, filterBulkStockCatalog } from "../application/bulk-stock-catalog-filters";
import type {
  BulkStockPreview,
  BulkStockVariant,
  BulkStockProductType,
  BulkStockSelectionPreviewRequest,
  LoadBulkStockCatalogAction,
} from "../domain/bulk-stock.model";

type Props = Readonly<{
  loading: boolean;
  error: string | null;
  catalogAction: LoadBulkStockCatalogAction;
  onSubmit: (request: BulkStockSelectionPreviewRequest) => void;
}>;

/** Los filtros se construyen con los atributos reales del catálogo de ML. */
export function BulkStockCatalogForm({ loading, error, catalogAction, onSubmit }: Props) {
  const [productType, setProductType] = useState<BulkStockProductType | null>(null);
  const [catalog, setCatalog] = useState<BulkStockPreview | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number | null>(null);
  const requestId = useRef(0);

  const selectProduct = async (next: BulkStockProductType) => {
    const currentRequest = ++requestId.current;
    setProductType(next);
    setCatalog(null);
    setCatalogError(null);
    setSelectedColors([]);
    setSelectedSizes([]);
    setQuantity(null);
    setCatalogLoading(true);
    try {
      const result = await catalogAction({ productType: next });
      if (currentRequest !== requestId.current) return;
      if (result.ok) setCatalog(result.data);
      else setCatalogError(result.message);
    } catch {
      if (currentRequest === requestId.current) {
        setCatalogError("No se pudieron cargar las publicaciones de Mercado Libre.");
      }
    } finally {
      if (currentRequest === requestId.current) setCatalogLoading(false);
    }
  };

  const colors = useMemo(
    () => distinctBulkStockFilterOptions(catalog?.variants.map((variant) => variant.color ?? "Sin color") ?? []),
    [catalog],
  );
  const sizes = useMemo(
    () => distinctBulkStockFilterOptions(catalog?.variants.map((variant) => variant.size) ?? []),
    [catalog],
  );
  const selected = useMemo(
    () => filterBulkStockCatalog(catalog?.variants ?? [], selectedColors, selectedSizes),
    [catalog, selectedColors, selectedSizes],
  );

  const validQuantity = quantity !== null && Number.isSafeInteger(quantity) && quantity >= 0;
  const canPreview = Boolean(productType && catalog && selected.length > 0 &&
    selected.length <= 1_000 && validQuantity && !catalogLoading && !loading);

  const submit = () => {
    if (!canPreview || !productType || quantity === null) return;
    onSubmit({
      productType,
      identifiers: selected.map((variant) => variant.key),
      quantity,
    });
  };

  return (
    <Form layout="vertical" onFinish={submit} style={{ maxWidth: 800 }}>
      {error ? <Alert message={error} showIcon type="error" style={{ marginBottom: 16 }} /> : null}
      {catalogError ? (
        <Alert
          message={catalogError}
          type="error"
          showIcon
          action={productType ? <Button onClick={() => void selectProduct(productType)}>Reintentar</Button> : null}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <Form.Item label="Producto" required>
        <Select
          aria-label="Producto"
          options={[...BULK_STOCK_PRODUCT_TYPE_OPTIONS]}
          placeholder="Seleccionar producto"
          value={productType ?? undefined}
          onChange={(next: BulkStockProductType) => void selectProduct(next)}
        />
      </Form.Item>
      {catalogLoading ? <Typography.Paragraph><Spin size="small" /> Cargando todas las publicaciones activas…</Typography.Paragraph> : null}
      {catalog ? (
        <>
          <Typography.Paragraph type="secondary">
            Encontradas {catalog.variants.length} variantes de {new Set(catalog.variants.flatMap((variant) => variant.relatedItemIds?.length ? variant.relatedItemIds : [variant.itemId])).size} publicaciones activas.
            Se incluyen publicaciones antiguas y nuevas, con cualquier precio y también sin stock.
          </Typography.Paragraph>
          <Form.Item label="Colores" extra="Podés elegir varios. Si no elegís ninguno, se incluyen todos los colores.">
            <Select
              aria-label="Colores"
              mode="multiple"
              tagRender={renderColorTag}
              allowClear
              maxTagCount="responsive"
              showSearch={{ optionFilterProp: "label" }}
              placeholder="Todos los colores"
              value={selectedColors}
              options={colors}
              onChange={setSelectedColors}
            />
          </Form.Item>
          <Form.Item label="Talles" extra="Podés combinar varios talles. Sin seleccionar ninguno, se incluyen todos.">
            <Select
              aria-label="Talles"
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              showSearch
              optionFilterProp="label"
              placeholder="Todos los talles"
              value={selectedSizes}
              options={sizes}
              onChange={setSelectedSizes}
            />
          </Form.Item>
          <Typography.Paragraph>
            <strong>{selected.length}</strong> variantes coinciden con los filtros.
          </Typography.Paragraph>
          <Table<BulkStockVariant>
            aria-label="Variantes encontradas para stock masivo"
            size="small"
            rowKey="key"
            dataSource={[...selected]}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 720 }}
            style={{ marginBottom: 16 }}
            columns={[
              { title: "Publicación", dataIndex: "title", key: "title", ellipsis: true },
              { title: "ID ML", dataIndex: "itemId", key: "itemId", width: 190, render: (_: string, row: BulkStockVariant) => (row.relatedItemIds?.length ? row.relatedItemIds : [row.itemId]).join(", ") },
              { title: "Color", dataIndex: "color", key: "color", width: 100, render: (value: string | null) => value ?? "—" },
              { title: "Talle", dataIndex: "size", key: "size", width: 90 },
              { title: "Stock actual", dataIndex: "currentStock", key: "currentStock", width: 115 },
            ]}
          />
          {selected.length > 1_000 ? (
            <Alert type="warning" message="Seleccioná menos variantes: el máximo por operación es 1000." showIcon style={{ marginBottom: 16 }} />
          ) : null}
          <Form.Item label="Nuevo stock por variante" required>
            <InputNumber
              aria-label="Nuevo stock por variante"
              min={0}
              max={Number.MAX_SAFE_INTEGER}
              precision={0}
              value={quantity}
              onChange={setQuantity}
              placeholder="Ejemplo: 10"
              style={{ width: 220 }}
            />
          </Form.Item>
          <Button htmlType="submit" loading={loading} disabled={!canPreview} type="primary">
            Ver vista previa
          </Button>
          <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
            Enter prepara una vista previa. El stock no cambia hasta confirmar «Aplicar cambios».
          </Typography.Paragraph>
        </>
      ) : null}
    </Form>
  );
}


/**
 * Personaliza únicamente las etiquetas de colores.
 * `mode="multiple"` controla la selección; `tagRender` dibuja cada Tag.
 */
const renderColorTag: NonNullable<SelectProps["tagRender"]> = ({
  label,
  closable,
  onClose,
}) => (
  <Tag
    closable={closable}
    onClose={onClose}
    onMouseDown={(event) => {
      event.preventDefault();
      event.stopPropagation();
    }}
    style={{
      borderRadius: 14,
      paddingInline: 10,
      marginInlineEnd: 4,
      fontWeight: 500,
    }}
  >
    {label}
  </Tag>
);
