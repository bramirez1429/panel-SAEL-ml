"use client";

import { Alert, Button, Card, Descriptions, Empty, Form, InputNumber, Modal, Progress, Select, Statistic, Table, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { TiendanubeCategory } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import type { TiendanubeBulkEditCategorySummary, TiendanubeBulkEditField, TiendanubeBulkEditJob, TiendanubeBulkEditPreview, TiendanubeBulkEditRequest } from "../domain/tiendanube-bulk-edit.model";
import styles from "./tiendanube-bulk-edit-view.module.css";

type ActionResult<T> = T | Readonly<{ ok: false; message: string }>;
type Props = Readonly<{
  categories: readonly TiendanubeCategory[];
  categoryError: string | null;
  getCategorySummaryAction(categoryId: number): Promise<ActionResult<TiendanubeBulkEditCategorySummary>>;
  previewAction(request: TiendanubeBulkEditRequest): Promise<ActionResult<TiendanubeBulkEditPreview>>;
  getActiveAction(): Promise<ActionResult<TiendanubeBulkEditJob | null>>;
}>;
type FormValues = Readonly<{ price?: number | null; promotionalPrice?: number | null; stock?: number | null }>;

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const fieldLabels: Record<TiendanubeBulkEditField, string> = { price: "Precio normal", promotionalPrice: "Precio promocional", stock: "Stock" };

function isError<T>(result: ActionResult<T>): result is Readonly<{ ok: false; message: string }> {
  return typeof result === "object" && result !== null && "ok" in result && result.ok === false;
}
export function TiendanubeBulkEditView(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>();
  const [summary, setSummary] = useState<TiendanubeBulkEditCategorySummary | null>(null);
  const [preview, setPreview] = useState<TiendanubeBulkEditPreview | null>(null);
  const [job, setJob] = useState<TiendanubeBulkEditJob | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(props.categoryError);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const price = Form.useWatch("price", form);
  const promotionalPrice = Form.useWatch("promotionalPrice", form);
  const stock = Form.useWatch("stock", form);

  const categoryOptions = useMemo(() => props.categories.map((category) => ({ value: category.id, label: categoryPath(category, props.categories) })), [props.categories]);
  const selectedCategory = props.categories.find((category) => category.id === selectedCategoryId);

  const applyJob = useCallback((nextJob: TiendanubeBulkEditJob): void => {
    setJob(nextJob);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const result = await props.getActiveAction();
        if (isError(result)) { setError(result.message); return; }
        if (result) applyJob(result);
      } catch (caught: unknown) {
        setError(errorMessage(caught, "No se pudo recuperar la actualización en curso."));
      }
    })();
  }, [applyJob, props]);

  async function loadCategorySummary(categoryId: number): Promise<void> {
    setLoadingSummary(true);
    try {
      const result = await props.getCategorySummaryAction(categoryId);
      if (isError(result)) setSummaryError(result.message);
      else { setSummary(result); setSummaryError(null); }
    } catch (caught: unknown) {
      setSummaryError(errorMessage(caught, "No se pudo cargar el resumen de la categoría."));
    } finally { setLoadingSummary(false); }
  }

  function selectCategory(categoryId: number): void {
    setSelectedCategoryId(categoryId); setSummary(null); setPreview(null); setError(null); setSummaryError(null);
    void loadCategorySummary(categoryId);
  }

  async function createPreview(): Promise<void> {
    if (!selectedCategoryId || !summary || submitting) return;
    try {
      const values = await form.validateFields();
      const request = createRequest(selectedCategoryId, values);
      setSubmitting(true); setError(null);
      const result = await props.previewAction(request);
      if (isError(result)) { setError(result.message); return; }
      setPreview(result);
    } catch (caught: unknown) {
      if (!isFormValidationError(caught)) {
        setError(errorMessage(caught, "No se pudo generar la previsualización."));
      }
    } finally { setSubmitting(false); }
  }

  const hasValidChanges = hasCompleteValidChanges(price, promotionalPrice, stock);
  const noProducts = summary !== null && summary.productCount === 0;
  return <main className={styles.page}>
    <header className={styles.header}><Typography.Title level={1}>Tiendanube — Edición masiva</Typography.Title><Typography.Text type="secondary">Actualizá precios y stock de todos los productos de una categoría desde un solo lugar.</Typography.Text></header>
    {error ? <Alert closable message={error} onClose={() => setError(null)} showIcon type="error" /> : null}

    <Card className={styles.card} title="Seleccionar categoría">
      <Select showSearch className={styles.categorySelect} loading={loadingSummary} notFoundContent={<Empty description="No hay categorías disponibles." image={Empty.PRESENTED_IMAGE_SIMPLE} />} onChange={(value) => { if (typeof value === "number") selectCategory(value); }} optionFilterProp="label" options={categoryOptions} placeholder="Buscar y seleccionar una categoría" size="large" value={selectedCategoryId} />
    </Card>

    {selectedCategoryId && loadingSummary ? <Card className={styles.card} loading /> : null}
    {selectedCategoryId && summaryError ? <Alert action={<Button onClick={() => { if (selectedCategoryId !== undefined) void loadCategorySummary(selectedCategoryId); }} size="small" type="primary">Reintentar cargar categoría</Button>} description="No se puede previsualizar hasta cargar el resumen real de productos y variantes." message={summaryError} showIcon type="error" /> : null}
    {summary && noProducts ? <Card className={styles.card}><Empty description="No hay productos en esta categoría." /></Card> : null}
    {summary && !noProducts ? <>
      <section className={styles.statistics} aria-label="Resumen de la categoría"><Card><Statistic title="Productos encontrados" value={summary.productCount} /></Card><Card><Statistic title="Variantes encontradas" value={summary.variantCount} /></Card></section>
      <Card className={styles.card} title="Productos y valores actuales"><Table dataSource={summary.products} expandable={{ expandedRowRender: (product) => <VariantPreview variants={product.variants} />, rowExpandable: (product) => product.variants.length > 0 }} pagination={false} rowKey="id" scroll={{ x: 680 }} size="small" columns={[{ title: "Producto", dataIndex: "name", key: "name" }, { title: "Variantes", key: "variants", render: (_, product) => product.variants.length }]} /></Card>
    </> : null}

    <Card className={styles.card} title="Cambios globales">
      <Form form={form} layout="vertical" onValuesChange={() => setPreview(null)} requiredMark={false}>
        <div className={styles.fields}>
          <Form.Item label="Precio normal (precio tachado)" name="price" rules={[{ type: "number", min: 0, message: "Ingresá un precio válido." }]}><NumericInput disabled={submitting} placeholder="$45.000" /></Form.Item>
          <Form.Item label="Precio promocional" name="promotionalPrice" rules={[{ type: "number", min: 0, message: "Ingresá un precio válido." }]}><NumericInput disabled={submitting} placeholder="$31.999" /></Form.Item>
          <Form.Item label="Stock por variante" name="stock" rules={[{ type: "number", min: 0, message: "El stock no puede ser negativo." }, { validator: (_, value: number | null | undefined) => !hasValue(value) || Number.isInteger(value) ? Promise.resolve() : Promise.reject(new Error("El stock debe ser entero.")) }]}><NumericInput disabled={submitting} placeholder="4 unidades" /></Form.Item>
        </div>
        <Alert message="Los cambios se aplicarán a todas las variantes de los productos de la categoría seleccionada." showIcon type="info" />
        <Button className={styles.primaryButton} disabled={!selectedCategoryId || !summary || noProducts || !hasValidChanges || submitting} loading={submitting} onClick={() => void createPreview()} size="large" type="primary">Previsualizar cambios</Button>
      </Form>
    </Card>

    {job ? <JobProgress job={job} /> : null}
    <Modal cancelText="Cerrar" footer={<Button onClick={() => setPreview(null)} type="primary">Cerrar</Button>} onCancel={() => setPreview(null)} open={preview !== null} title="Previsualización de cambios" width={760}>
      {preview ? <PreviewContent categoryName={selectedCategory?.name ?? "Categoría seleccionada"} preview={preview} /> : null}
    </Modal>
  </main>;
}

function NumericInput({ disabled, placeholder }: Readonly<{ disabled: boolean; placeholder: string }>) { return <InputNumber className={styles.input} controls={false} disabled={disabled} min={0} placeholder={placeholder} precision={0} size="large" />; }
function VariantPreview({ variants }: Readonly<{ variants: TiendanubeBulkEditCategorySummary["products"][number]["variants"] }>) { return <Table dataSource={variants} pagination={false} rowKey="id" scroll={{ x: 700 }} size="small" columns={[{ title: "Talle / Color", key: "attributes", render: (_, item) => [item.size, item.color].filter(Boolean).join(" / ") || "—" }, { title: "SKU", dataIndex: "sku", render: (value) => value ?? "Sin SKU" }, { title: "Precio", dataIndex: "price", render: formatValue }, { title: "Promoción", dataIndex: "promotionalPrice", render: formatValue }, { title: "Stock", dataIndex: "stock", render: (value) => value ?? "—" }]} />; }
function PreviewContent({ categoryName, preview }: Readonly<{ categoryName: string; preview: TiendanubeBulkEditPreview }>) { return <><Descriptions bordered column={1}><Descriptions.Item label="Categoría">{categoryName}</Descriptions.Item><Descriptions.Item label="Productos">{preview.productCount}</Descriptions.Item><Descriptions.Item label="Variantes">{preview.variantCount}</Descriptions.Item>{preview.changes.price !== undefined ? <Descriptions.Item label={fieldLabels.price}>{formatValue(preview.changes.price)}</Descriptions.Item> : null}{preview.changes.promotionalPrice !== undefined ? <Descriptions.Item label={fieldLabels.promotionalPrice}>{formatValue(preview.changes.promotionalPrice)}</Descriptions.Item> : null}{preview.changes.stock !== undefined ? <Descriptions.Item label={fieldLabels.stock}>{preview.changes.stock}</Descriptions.Item> : null}<Descriptions.Item label="Campos que se conservarán">{preview.preservedFields.map((field) => fieldLabels[field]).join(", ") || "Ninguno"}</Descriptions.Item></Descriptions><Alert className={styles.previewAlert} message="La previsualización está disponible. La aplicación de cambios se habilitará cuando finalice el procesamiento masivo." showIcon type="info" />{preview.incompatibilities.length > 0 ? <Alert className={styles.previewAlert} description={<ul>{preview.incompatibilities.map((item) => <li key={item.variantId}>{`Variante ${item.variantId}: ${item.reason}`}</li>)}</ul>} message="Incompatibilidades detectadas" showIcon type="warning" /> : null}</>; }
function JobProgress({ job }: Readonly<{ job: TiendanubeBulkEditJob }>) { const percent = job.totalVariants === 0 ? 0 : Math.round(((job.completedVariants + job.failedVariants) / job.totalVariants) * 100); const result = `Estado actual: ${job.status}.`; return <Card className={styles.card} title="Progreso de actualización"><Alert message={result} showIcon type="info" /><Progress percent={percent} status={job.status === "FAILED" ? "exception" : undefined} /><section className={styles.statistics}><Statistic title="Total de productos" value={job.totalProducts} /><Statistic title="Total de variantes" value={job.totalVariants} /><Statistic title="Variantes completadas" value={job.completedVariants} /><Statistic title="Variantes fallidas" value={job.failedVariants} /><Statistic title="Variantes pendientes" value={job.pendingVariants} /></section></Card>; }
function categoryPath(category: TiendanubeCategory, categories: readonly TiendanubeCategory[]): string { const names = [category.name]; let parentId = category.parentId; while (parentId !== null) { const parent = categories.find((item) => item.id === parentId); if (!parent) break; names.unshift(parent.name); parentId = parent.parentId; } return names.join(" / "); }
function formatValue(value: string | number | null | undefined): string { return value === null || value === undefined ? "Valores diferentes" : currency.format(Number(value)); }
function hasValue(value: number | null | undefined): value is number { return typeof value === "number"; }
function hasCompleteValidChanges(price: number | null | undefined, promotionalPrice: number | null | undefined, stock: number | null | undefined): boolean {
  const values = [price, promotionalPrice, stock];
  return values.some(hasValue) && values.every((value) => !hasValue(value) || (value >= 0 && Number.isInteger(value)));
}
function isFormValidationError(error: unknown): error is Readonly<{ errorFields: readonly unknown[] }> {
  return typeof error === "object" && error !== null && "errorFields" in error && Array.isArray(error.errorFields);
}
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}
function createRequest(categoryId: number, values: FormValues): TiendanubeBulkEditRequest { if (!hasValue(values.price) && !hasValue(values.promotionalPrice) && !hasValue(values.stock)) throw new Error("Completá al menos un campo."); return { categoryId: String(categoryId), changes: { ...(hasValue(values.price) ? { price: String(values.price) } : {}), ...(hasValue(values.promotionalPrice) ? { promotionalPrice: String(values.promotionalPrice) } : {}), ...(hasValue(values.stock) ? { stock: values.stock } : {}) } }; }
