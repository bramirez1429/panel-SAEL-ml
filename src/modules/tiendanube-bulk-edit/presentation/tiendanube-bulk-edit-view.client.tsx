"use client";

import { CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Descriptions, Empty, Form, InputNumber, Modal, Progress, Select, Statistic, Table, Tag, Tooltip, Typography, message } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TiendanubeCategory } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import type { TiendanubeBulkEditCategorySummary, TiendanubeBulkEditFailure, TiendanubeBulkEditFailuresPage, TiendanubeBulkEditField, TiendanubeBulkEditJob, TiendanubeBulkEditPreview, TiendanubeBulkEditRequest } from "../domain/tiendanube-bulk-edit.model";
import styles from "./tiendanube-bulk-edit-view.module.css";

type ActionResult<T> = T | Readonly<{ ok: false; message: string }>;
type Props = Readonly<{
  categories: readonly TiendanubeCategory[];
  categoryError: string | null;
  getCategorySummaryAction(categoryId: number): Promise<ActionResult<TiendanubeBulkEditCategorySummary>>;
  previewAction(request: TiendanubeBulkEditRequest): Promise<ActionResult<TiendanubeBulkEditPreview>>;
  startAction(previewId: string): Promise<ActionResult<TiendanubeBulkEditJob>>;
  getActiveAction(): Promise<ActionResult<TiendanubeBulkEditJob | null>>;
  getJobAction(jobId: string): Promise<ActionResult<TiendanubeBulkEditJob>>;
  getFailuresAction(jobId: string, page: number, pageSize: number): Promise<ActionResult<TiendanubeBulkEditFailuresPage>>;
  retryFailuresAction(jobId: string): Promise<ActionResult<TiendanubeBulkEditJob>>;
}>;
type FormValues = Readonly<{ price?: number | null; promotionalPrice?: number | null; stock?: number | null; locationId?: string }>;

const FAILURE_PAGE_SIZE = 10;
const POLLING_INTERVAL_MS = 4_000;
const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const fieldLabels: Record<TiendanubeBulkEditField, string> = { price: "Precio normal", promotionalPrice: "Precio promocional", stock: "Stock" };

function isError<T>(result: ActionResult<T>): result is Readonly<{ ok: false; message: string }> {
  return typeof result === "object" && result !== null && "ok" in result && result.ok === false;
}
function isRunning(job: TiendanubeBulkEditJob | null): boolean { return job?.status === "QUEUED" || job?.status === "RUNNING"; }

export function TiendanubeBulkEditView(props: Props) {
  const [form] = Form.useForm<FormValues>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>();
  const [summary, setSummary] = useState<TiendanubeBulkEditCategorySummary | null>(null);
  const [preview, setPreview] = useState<TiendanubeBulkEditPreview | null>(null);
  const [job, setJob] = useState<TiendanubeBulkEditJob | null>(null);
  const [failures, setFailures] = useState<TiendanubeBulkEditFailuresPage | null>(null);
  const [failurePage, setFailurePage] = useState(1);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(props.categoryError);
  const jobRequestInFlight = useRef(false);
  const price = Form.useWatch("price", form);
  const promotionalPrice = Form.useWatch("promotionalPrice", form);
  const stock = Form.useWatch("stock", form);

  const categoryOptions = useMemo(() => props.categories.map((category) => ({ value: category.id, label: categoryPath(category, props.categories) })), [props.categories]);
  const selectedCategory = props.categories.find((category) => category.id === selectedCategoryId);

  const loadFailures = useCallback(async (jobId: string, page: number): Promise<void> => {
    const result = await props.getFailuresAction(jobId, page, FAILURE_PAGE_SIZE);
    if (isError(result)) { setError(result.message); return; }
    setFailures(result);
  }, [props]);

  const applyJob = useCallback((nextJob: TiendanubeBulkEditJob): void => {
    setJob(nextJob);
    if (nextJob.failedVariants > 0) void loadFailures(nextJob.id, failurePage);
  }, [failurePage, loadFailures]);

  const refreshJob = useCallback(async (jobId: string): Promise<void> => {
    if (jobRequestInFlight.current) return;
    jobRequestInFlight.current = true;
    try {
      const result = await props.getJobAction(jobId);
      if (isError(result)) setError(result.message);
      else { setError(null); applyJob(result); }
    } finally { jobRequestInFlight.current = false; }
  }, [applyJob, props]);

  useEffect(() => {
    void (async () => {
      const result = await props.getActiveAction();
      if (isError(result)) { setError(result.message); return; }
      if (result) applyJob(result);
    })();
  }, [applyJob, props]);

  useEffect(() => {
    if (!job || !isRunning(job)) return;
    const timer = window.setInterval(() => void refreshJob(job.id), POLLING_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [job, refreshJob]);

  async function selectCategory(categoryId: number): Promise<void> {
    setSelectedCategoryId(categoryId); setSummary(null); setPreview(null); setError(null); setLoadingSummary(true);
    try {
      const result = await props.getCategorySummaryAction(categoryId);
      if (isError(result)) setError(result.message); else setSummary(result);
    } finally { setLoadingSummary(false); }
  }

  async function createPreview(): Promise<void> {
    if (!selectedCategoryId || isRunning(job)) return;
    try {
      const values = await form.validateFields();
      const request = createRequest(selectedCategoryId, values, summary?.locations ?? []);
      setSubmitting(true); setError(null);
      const result = await props.previewAction(request);
      if (isError(result)) { setError(result.message); return; }
      setPreview(result);
    } catch { /* Ant Design displays validation errors beside fields. */ } finally { setSubmitting(false); }
  }

  async function confirm(): Promise<void> {
    if (!preview || submitting) return;
    setSubmitting(true); setError(null);
    try {
      const result = await props.startAction(preview.id);
      if (isError(result)) { setError(result.message); return; }
      setPreview(null); applyJob(result);
    } finally { setSubmitting(false); }
  }

  async function retryFailures(): Promise<void> {
    if (!job || submitting) return;
    setSubmitting(true); setError(null);
    try {
      const result = await props.retryFailuresAction(job.id);
      if (isError(result)) { setError(result.message); return; }
      applyJob(result);
    } finally { setSubmitting(false); }
  }

  const requiresLocation = hasValue(stock) && (summary?.locations.length ?? 0) > 1;
  const hasChanges = hasValue(price) || hasValue(promotionalPrice) || hasValue(stock);
  const noProducts = summary !== null && summary.productCount === 0;
  return <main className={styles.page}>
    <header className={styles.header}><Typography.Title level={1}>Tiendanube — Edición masiva</Typography.Title><Typography.Text type="secondary">Actualizá precios y stock de todos los productos de una categoría desde un solo lugar.</Typography.Text></header>
    {error ? <Alert closable message={error} onClose={() => setError(null)} showIcon type="error" /> : null}

    <Card className={styles.card} title="Seleccionar categoría">
      <Select showSearch className={styles.categorySelect} disabled={isRunning(job)} loading={loadingSummary} notFoundContent={<Empty description="No hay categorías disponibles." image={Empty.PRESENTED_IMAGE_SIMPLE} />} onChange={(value) => { if (typeof value === "number") void selectCategory(value); }} optionFilterProp="label" options={categoryOptions} placeholder="Buscar y seleccionar una categoría" size="large" value={selectedCategoryId} />
    </Card>

    {selectedCategoryId && loadingSummary ? <Card className={styles.card} loading /> : null}
    {summary && noProducts ? <Card className={styles.card}><Empty description="No hay productos en esta categoría." /></Card> : null}
    {summary && !noProducts ? <>
      <section className={styles.statistics} aria-label="Resumen de la categoría"><Card><Statistic title="Productos encontrados" value={summary.productCount} /></Card><Card><Statistic title="Variantes encontradas" value={summary.variantCount} /></Card></section>
      <Card className={styles.card} title="Productos y valores actuales"><Table dataSource={summary.products} expandable={{ expandedRowRender: (product) => <VariantPreview variants={product.variants} />, rowExpandable: (product) => product.variants.length > 0 }} pagination={false} rowKey="id" scroll={{ x: 680 }} size="small" columns={[{ title: "Producto", dataIndex: "name", key: "name" }, { title: "Variantes", key: "variants", render: (_, product) => product.variants.length }]} /></Card>
    </> : null}

    <Card className={styles.card} title="Cambios globales">
      <Form form={form} layout="vertical" onValuesChange={() => setPreview(null)} requiredMark={false}>
        <div className={styles.fields}>
          <Form.Item label="Precio normal (precio tachado)" name="price" rules={[{ type: "number", min: 0, message: "Ingresá un precio válido." }]}><NumericInput disabled={isRunning(job)} placeholder="$45.000" /></Form.Item>
          <Form.Item label="Precio promocional" name="promotionalPrice" rules={[{ type: "number", min: 0, message: "Ingresá un precio válido." }]}><NumericInput disabled={isRunning(job)} placeholder="$31.999" /></Form.Item>
          <Form.Item label="Stock por variante" name="stock" rules={[{ type: "number", min: 0, message: "El stock no puede ser negativo." }, { validator: (_, value: number | null | undefined) => !hasValue(value) || Number.isInteger(value) ? Promise.resolve() : Promise.reject(new Error("El stock debe ser entero.")) }]}><NumericInput disabled={isRunning(job)} placeholder="4 unidades" /></Form.Item>
        </div>
        {requiresLocation ? <Form.Item label="Ubicación de stock" name="locationId" rules={[{ required: true, message: "Seleccioná la ubicación a actualizar." }]}><Select disabled={isRunning(job)} options={summary?.locations.map((location) => ({ value: location.id, label: location.name }))} placeholder="Seleccionar ubicación" size="large" /></Form.Item> : null}
        <Alert message="Los cambios se aplicarán a todas las variantes de los productos de la categoría seleccionada." showIcon type="info" />
        <Button className={styles.primaryButton} disabled={!selectedCategoryId || noProducts || !hasChanges || isRunning(job)} loading={submitting} onClick={() => void createPreview()} size="large" type="primary">Previsualizar cambios</Button>
      </Form>
    </Card>

    {job ? <JobProgress job={job} onRetry={() => void retryFailures()} retrying={submitting} /> : null}
    {job && failures ? <FailuresTable failures={failures} page={failurePage} onPageChange={(page) => { setFailurePage(page); void loadFailures(job.id, page); }} /> : null}
    <Modal cancelText="Cancelar" confirmLoading={submitting} okButtonProps={{ disabled: (preview?.incompatibilities.length ?? 0) > 0 }} okText="Confirmar actualización global" onCancel={() => setPreview(null)} onOk={() => void confirm()} open={preview !== null} title="Confirmar actualización global" width={760}>
      {preview ? <PreviewContent categoryName={selectedCategory?.name ?? "Categoría seleccionada"} preview={preview} /> : null}
    </Modal>
  </main>;
}

function NumericInput({ disabled, placeholder }: Readonly<{ disabled: boolean; placeholder: string }>) { return <InputNumber className={styles.input} controls={false} disabled={disabled} min={0} placeholder={placeholder} precision={0} size="large" />; }
function VariantPreview({ variants }: Readonly<{ variants: TiendanubeBulkEditCategorySummary["products"][number]["variants"] }>) { return <Table dataSource={variants} pagination={false} rowKey="id" scroll={{ x: 700 }} size="small" columns={[{ title: "Talle / Color", key: "attributes", render: (_, item) => [item.size, item.color].filter(Boolean).join(" / ") || "—" }, { title: "SKU", dataIndex: "sku", render: (value) => value ?? "Sin SKU" }, { title: "Precio", dataIndex: "price", render: formatValue }, { title: "Promoción", dataIndex: "promotionalPrice", render: formatValue }, { title: "Stock", dataIndex: "stock", render: (value) => value ?? "—" }]} />; }
function PreviewContent({ categoryName, preview }: Readonly<{ categoryName: string; preview: TiendanubeBulkEditPreview }>) { return <><Descriptions bordered column={1}><Descriptions.Item label="Categoría">{categoryName}</Descriptions.Item><Descriptions.Item label="Productos">{preview.productCount}</Descriptions.Item><Descriptions.Item label="Variantes">{preview.variantCount}</Descriptions.Item>{preview.changes.price !== undefined ? <Descriptions.Item label={fieldLabels.price}>{formatValue(preview.changes.price)}</Descriptions.Item> : null}{preview.changes.promotionalPrice !== undefined ? <Descriptions.Item label={fieldLabels.promotionalPrice}>{formatValue(preview.changes.promotionalPrice)}</Descriptions.Item> : null}{preview.changes.stock !== undefined ? <Descriptions.Item label={fieldLabels.stock}>{preview.changes.stock}</Descriptions.Item> : null}<Descriptions.Item label="Campos que se conservarán">{preview.preservedFields.map((field) => fieldLabels[field]).join(", ") || "Ninguno"}</Descriptions.Item></Descriptions>{preview.incompatibilities.length > 0 ? <Alert className={styles.previewAlert} description={preview.incompatibilities.join(" ")} message="Incompatibilidades detectadas" showIcon type="warning" /> : null}</>; }
function JobProgress({ job, onRetry, retrying }: Readonly<{ job: TiendanubeBulkEditJob; onRetry(): void; retrying: boolean }>) { const percent = job.totalVariants === 0 ? 0 : Math.round(((job.updatedVariants + job.failedVariants) / job.totalVariants) * 100); const result = job.status === "COMPLETED" ? "Actualización completada correctamente." : job.status === "COMPLETED_WITH_ERRORS" ? "Actualización completada con errores." : job.status === "PAUSED" || job.status === "FAILED" ? "Actualización pausada por problema general." : `Estado actual: ${job.status}.`; return <Card className={styles.card} title="Progreso de actualización"><Alert message={result} showIcon type={job.status === "COMPLETED" ? "success" : job.status === "COMPLETED_WITH_ERRORS" || job.status === "FAILED" ? "warning" : "info"} /><Progress percent={percent} status={job.status === "FAILED" ? "exception" : undefined} /><section className={styles.statistics}><Statistic title="Total de productos" value={job.totalProducts} /><Statistic title="Total de variantes" value={job.totalVariants} /><Statistic title="Variantes actualizadas" value={job.updatedVariants} /><Statistic title="Variantes fallidas" value={job.failedVariants} /><Statistic title="Variantes pendientes" value={job.pendingVariants} /></section>{job.failedVariants > 0 ? <Button className={styles.primaryButton} icon={<ReloadOutlined />} loading={retrying} onClick={onRetry} size="large">Reintentar solamente los fallidos</Button> : null}</Card>; }
function FailuresTable({ failures, page, onPageChange }: Readonly<{ failures: TiendanubeBulkEditFailuresPage; page: number; onPageChange(page: number): void }>) { return <Card className={styles.card} title="Productos que no se pudieron actualizar"><Table<TiendanubeBulkEditFailure> dataSource={failures.items} pagination={{ current: page, pageSize: FAILURE_PAGE_SIZE, total: failures.total, onChange: onPageChange }} rowKey="id" scroll={{ x: 1200 }} columns={[{ title: "Producto", dataIndex: "productName" }, { title: "ID Tiendanube", dataIndex: "tiendanubeProductId", render: (value) => <Copy value={value} /> }, { title: "ID variante", dataIndex: "variantId", render: (value) => <Copy value={value} /> }, { title: "SKU", dataIndex: "sku", render: (value) => value ? <Copy value={value} /> : "Sin SKU" }, { title: "Talle / Color", key: "attributes", render: (_, item) => [item.size, item.color].filter(Boolean).join(" / ") || "—" }, { title: "Campo", dataIndex: "field", render: (_, item) => fieldLabels[item.field] }, { title: "Motivo del error", dataIndex: "message", render: (value, item) => item.technicalDetail ? <Tooltip title={item.technicalDetail}>{value}</Tooltip> : value }, { title: "Estado", dataIndex: "status", render: (value) => <Tag color={value === "PENDING_RETRY" ? "orange" : "red"}>{value}</Tag> }, { title: "Acciones", key: "actions", render: (_, item) => item.adminUrl ? <Button href={item.adminUrl} rel="noreferrer" size="small" target="_blank">Abrir en Tiendanube</Button> : "—" }]} /></Card>; }
function Copy({ value }: Readonly<{ value: string }>) { return <Button icon={<CopyOutlined />} onClick={() => void navigator.clipboard.writeText(value).then(() => message.success("Copiado."), () => message.error("No se pudo copiar."))} size="small">{value}</Button>; }
function categoryPath(category: TiendanubeCategory, categories: readonly TiendanubeCategory[]): string { const names = [category.name]; let parentId = category.parentId; while (parentId !== null) { const parent = categories.find((item) => item.id === parentId); if (!parent) break; names.unshift(parent.name); parentId = parent.parentId; } return names.join(" / "); }
function formatValue(value: number | null | undefined): string { return value === null || value === undefined ? "Valores diferentes" : currency.format(value); }
function hasValue(value: number | null | undefined): value is number { return typeof value === "number"; }
function createRequest(categoryId: number, values: FormValues, locations: readonly Readonly<{ id: string; name: string }>[]): TiendanubeBulkEditRequest { if (!hasValue(values.price) && !hasValue(values.promotionalPrice) && !hasValue(values.stock)) throw new Error("Completá al menos un campo."); return { categoryId, ...(hasValue(values.price) ? { price: values.price } : {}), ...(hasValue(values.promotionalPrice) ? { promotionalPrice: values.promotionalPrice } : {}), ...(hasValue(values.stock) ? { stock: values.stock, ...(locations.length > 1 ? { locationId: values.locationId } : {}) } : {}) }; }
