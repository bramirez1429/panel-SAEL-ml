"use client";

import { Alert, Button, Card, Descriptions, Empty, Form, InputNumber, Modal, Progress, Select, Statistic, Table, Typography } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TiendanubeCategory } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import type { TiendanubeBulkEditCategorySummary, TiendanubeBulkEditFailure, TiendanubeBulkEditField, TiendanubeBulkEditJob, TiendanubeBulkEditPreview, TiendanubeBulkEditRequest } from "../domain/tiendanube-bulk-edit.model";
import styles from "./tiendanube-bulk-edit-view.module.css";

type ActionResult<T> = T | Readonly<{ ok: false; message: string }>;
type Props = Readonly<{
  categories: readonly TiendanubeCategory[];
  categoryError: string | null;
  getCategorySummaryAction(categoryId: number): Promise<ActionResult<TiendanubeBulkEditCategorySummary>>;
  previewAction(request: TiendanubeBulkEditRequest): Promise<ActionResult<TiendanubeBulkEditPreview>>;
  getActiveAction(): Promise<ActionResult<TiendanubeBulkEditJob | null>>;
  createJobAction(previewId: string): Promise<ActionResult<TiendanubeBulkEditJob>>;
  getJobAction(jobId: string): Promise<ActionResult<TiendanubeBulkEditJob>>;
  retryFailedAction(jobId: string): Promise<ActionResult<TiendanubeBulkEditJob>>;
}>;
type FormValues = Readonly<{ price?: number | null; promotionalPrice?: number | null; stock?: number | null }>;

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const fieldLabels: Record<TiendanubeBulkEditField, string> = { price: "Precio normal", promotionalPrice: "Precio promocional", stock: "Stock" };
const POLLING_INTERVAL_MS = 1_500;

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
  const [pollingError, setPollingError] = useState<string | null>(null);
  const previewRequestInFlight = useRef(false);

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

  useEffect(() => {
    if (!job || !isRunning(job.status)) return;
    let active = true;
    let timeout: number | undefined;
    const poll = async (): Promise<void> => {
      try {
        const result = await props.getJobAction(job.id);
        if (!active) return;
        if (isError(result)) {
          setPollingError(result.message);
          if (active) timeout = window.setTimeout(() => void poll(), POLLING_INTERVAL_MS);
          return;
        }
        applyJob(result); setPollingError(null);
        if (active && isRunning(result.status)) timeout = window.setTimeout(() => void poll(), POLLING_INTERVAL_MS);
      } catch (caught: unknown) {
        if (!active) return;
        setPollingError(errorMessage(caught, "No se pudo consultar el progreso."));
        timeout = window.setTimeout(() => void poll(), POLLING_INTERVAL_MS);
      }
    };
    void poll();
    return () => { active = false; if (timeout !== undefined) window.clearTimeout(timeout); };
  }, [applyJob, job, props]);

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
    if (submitting || previewRequestInFlight.current) return;
    if (selectedCategoryId === undefined) {
      setError("Seleccioná una categoría");
      return;
    }
    previewRequestInFlight.current = true;
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
    } finally {
      previewRequestInFlight.current = false;
      setSubmitting(false);
    }
  }

  async function confirmChanges(): Promise<void> {
    if (!preview || submitting) return;
    setSubmitting(true); setError(null);
    try {
      const result = await props.createJobAction(preview.id);
      if (isError(result)) { setError(result.message); return; }
      applyJob(result); setPollingError(null); setPreview(null);
    } catch (caught: unknown) {
      setError(errorMessage(caught, "No se pudo iniciar la actualización."));
    } finally { setSubmitting(false); }
  }

  async function retryFailures(): Promise<void> {
    if (!job || job.failedVariants === 0 || submitting) return;
    setSubmitting(true); setError(null);
    try {
      const result = await props.retryFailedAction(job.id);
      if (isError(result)) { setError(result.message); return; }
      applyJob(result); setPollingError(null);
    } catch (caught: unknown) {
      setError(errorMessage(caught, "No se pudieron reintentar las variantes fallidas."));
    } finally { setSubmitting(false); }
  }

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
        <Button className={styles.primaryButton} loading={submitting} onClick={() => void createPreview()} size="large" type="primary">Previsualizar cambios</Button>
      </Form>
    </Card>

    {job ? <JobProgress job={job} pollingError={pollingError} retrying={submitting} onRetryFailures={() => void retryFailures()} /> : null}
    <Modal cancelText="Cerrar" footer={preview ? <><Button disabled={submitting} onClick={() => setPreview(null)}>Cancelar</Button><Button className={styles.confirmButton} loading={submitting} onClick={() => void confirmChanges()} type="primary">Confirmar y aplicar cambios</Button></> : null} onCancel={() => setPreview(null)} open={preview !== null} title="Previsualización de cambios" width={760}>
      {preview ? <PreviewContent categoryName={selectedCategory?.name ?? "Categoría seleccionada"} error={error} preview={preview} /> : null}
    </Modal>
  </main>;
}

function NumericInput({ disabled, placeholder }: Readonly<{ disabled: boolean; placeholder: string }>) { return <InputNumber className={styles.input} controls={false} disabled={disabled} min={0} placeholder={placeholder} precision={0} size="large" />; }
function VariantPreview({ variants }: Readonly<{ variants: TiendanubeBulkEditCategorySummary["products"][number]["variants"] }>) { return <Table dataSource={variants} pagination={false} rowKey="id" scroll={{ x: 700 }} size="small" columns={[{ title: "Talle / Color", key: "attributes", render: (_, item) => [item.size, item.color].filter(Boolean).join(" / ") || "—" }, { title: "SKU", dataIndex: "sku", render: (value) => value ?? "Sin SKU" }, { title: "Precio", dataIndex: "price", render: formatValue }, { title: "Promoción", dataIndex: "promotionalPrice", render: formatValue }, { title: "Stock", dataIndex: "stock", render: (value) => value ?? "—" }]} />; }
function PreviewContent({ categoryName, error, preview }: Readonly<{ categoryName: string; error: string | null; preview: TiendanubeBulkEditPreview }>) { return <>{error ? <Alert className={styles.previewAlert} message={error} showIcon type="error" /> : null}<Descriptions bordered column={1}><Descriptions.Item label="Categoría">{categoryName}</Descriptions.Item><Descriptions.Item label="Productos">{preview.productCount}</Descriptions.Item><Descriptions.Item label="Variantes">{preview.variantCount}</Descriptions.Item>{preview.changes.price !== undefined ? <Descriptions.Item label={fieldLabels.price}>{formatValue(preview.changes.price)}</Descriptions.Item> : null}{preview.changes.promotionalPrice !== undefined ? <Descriptions.Item label={fieldLabels.promotionalPrice}>{formatValue(preview.changes.promotionalPrice)}</Descriptions.Item> : null}{preview.changes.stock !== undefined ? <Descriptions.Item label={fieldLabels.stock}>{preview.changes.stock}</Descriptions.Item> : null}<Descriptions.Item label="Campos que se conservarán">{preview.preservedFields.map((field) => fieldLabels[field]).join(", ") || "Ninguno"}</Descriptions.Item></Descriptions><Alert className={styles.previewAlert} message="Confirmá para iniciar la actualización real en Tiendanube." showIcon type="info" />{preview.incompatibilities.length > 0 ? <Alert className={styles.previewAlert} description={<ul>{preview.incompatibilities.map((item) => <li key={item.variantId}>{`Variante ${item.variantId}: ${item.reason}`}</li>)}</ul>} message="Incompatibilidades detectadas" showIcon type="warning" /> : null}</>; }
function JobProgress({ job, pollingError, retrying, onRetryFailures }: Readonly<{ job: TiendanubeBulkEditJob; pollingError: string | null; retrying: boolean; onRetryFailures: () => void }>) { const percent = job.totalVariants === 0 ? 0 : Math.round(((job.completedVariants + job.failedVariants) / job.totalVariants) * 100); const finished = !isRunning(job.status); return <Card className={styles.card} title="Progreso de actualización">{pollingError ? <Alert description="El seguimiento se reintentará automáticamente. El proceso continúa en el backend." message={pollingError} showIcon type="warning" /> : null}<Alert message={finished ? "El backend confirmó que el proceso finalizó." : `Estado actual: ${job.status}.`} showIcon type={job.status === "FAILED" ? "error" : "info"} /><Progress percent={percent} status={job.status === "FAILED" ? "exception" : finished ? "success" : "active"} /><section className={styles.statistics}><Statistic title="Total de productos" value={job.totalProducts} /><Statistic title="Total de variantes" value={job.totalVariants} /><Statistic title="Variantes actualizadas" value={job.completedVariants} /><Statistic title="Variantes fallidas" value={job.failedVariants} /><Statistic title="Variantes pendientes" value={job.pendingVariants} /></section>{job.failures.length > 0 ? <FailuresTable failures={job.failures} /> : null}{finished && job.failedVariants > 0 ? <Button className={styles.retryButton} loading={retrying} onClick={onRetryFailures} type="primary">Reintentar solo los fallidos</Button> : null}</Card>; }
function FailuresTable({ failures }: Readonly<{ failures: readonly TiendanubeBulkEditFailure[] }>) { return <Table className={styles.failuresTable} dataSource={failures} pagination={false} rowKey={(item) => item.variantId} scroll={{ x: 900 }} size="small" columns={[{ title: "Nombre", dataIndex: "productName" }, { title: "ID", dataIndex: "productId" }, { title: "SKU", dataIndex: "sku", render: (value) => value ?? "Sin SKU" }, { title: "Variante", dataIndex: "variant", render: (value) => value ?? "—" }, { title: "Error", dataIndex: "error" }]} />; }
function isRunning(status: TiendanubeBulkEditJob["status"]): boolean { return status === "QUEUED" || status === "RUNNING" || status === "PAUSED"; }
function categoryPath(category: TiendanubeCategory, categories: readonly TiendanubeCategory[]): string { const names = [category.name]; let parentId = category.parentId; while (parentId !== null) { const parent = categories.find((item) => item.id === parentId); if (!parent) break; names.unshift(parent.name); parentId = parent.parentId; } return names.join(" / "); }
function formatValue(value: string | number | null | undefined): string { return value === null || value === undefined ? "Valores diferentes" : currency.format(Number(value)); }
function hasValue(value: number | null | undefined): value is number { return typeof value === "number"; }
function isFormValidationError(error: unknown): error is Readonly<{ errorFields: readonly unknown[] }> {
  return typeof error === "object" && error !== null && "errorFields" in error && Array.isArray(error.errorFields);
}
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}
function createRequest(categoryId: number, values: FormValues): TiendanubeBulkEditRequest { if (!hasValue(values.price) && !hasValue(values.promotionalPrice) && !hasValue(values.stock)) throw new Error("Completá al menos un campo."); return { categoryId: String(categoryId), changes: { ...(hasValue(values.price) ? { price: String(values.price) } : {}), ...(hasValue(values.promotionalPrice) ? { promotionalPrice: String(values.promotionalPrice) } : {}), ...(hasValue(values.stock) ? { stock: values.stock } : {}) } }; }
