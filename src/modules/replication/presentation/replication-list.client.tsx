"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Empty, Image, InputNumber, Modal, Radio, Select, Skeleton, Space, Spin, Tag, Typography, message } from "antd";
import type { ReplicationOptions, TiendanubeCategory } from "@/modules/tiendanube/domain/tiendanube-replication.model";
import type { ReplicablePublication, ReplicationPreview } from "../domain/replication.model";
import { CopyableText } from "@/shared/ui/copyable-text.client";
import styles from "./replication-list.module.css";

type ReplicateAction = (sourceKey: string, options: ReplicationOptions) => Promise<Readonly<{ ok: true; action: "created" | "updated" } | { ok: false; message: string }>>;
type PreviewAction = (sourceKey: string) => Promise<Readonly<{ ok: true; preview: ReplicationPreview } | { ok: false; message: string }>>;
type CategoriesAction = () => Promise<Readonly<{ ok: true; categories: readonly TiendanubeCategory[] } | { ok: false; message: string }>>;
type Props = Readonly<{ publications: readonly ReplicablePublication[]; replicateAction: ReplicateAction; loadPreviewAction: PreviewAction; loadCategoriesAction: CategoriesAction }>;
type ModalPhase = "loading" | "configuring" | "processing" | "success" | "error";

export function ReplicationListClient({ publications, replicateAction, loadPreviewAction, loadCategoriesAction }: Props) {
  const [visibleCount, setVisibleCount] = useState(20);
  const [appending, setAppending] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<ReplicablePublication | null>(null);
  const [preview, setPreview] = useState<ReplicationPreview | null>(null);
  const [categories, setCategories] = useState<readonly TiendanubeCategory[]>([]);
  const [phase, setPhase] = useState<ModalPhase>("loading");
  const [failure, setFailure] = useState<string | null>(null);
  const [priceMode, setPriceMode] = useState<ReplicationOptions["priceMode"]>("KEEP_SOURCE");
  const [price, setPrice] = useState<number>();
  const [tagMode, setTagMode] = useState<ReplicationOptions["tagMode"]>("KEEP_SOURCE");
  const [tags, setTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<number>();
  const [lastOptions, setLastOptions] = useState<ReplicationOptions | null>(null);
  const [completedAction, setCompletedAction] = useState<"created" | "updated" | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const visible = publications.slice(0, visibleCount);
  const hasMore = visibleCount < publications.length;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting || appending) return;
      setAppending(true);
      window.setTimeout(() => { setVisibleCount((count) => Math.min(count + 20, publications.length)); setAppending(false); }, 120);
    }, { rootMargin: "240px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [appending, hasMore, publications.length]);

  async function openReplication(publication: ReplicablePublication) {
    setSelected(publication); setPreview(null); setCategories([]); setFailure(null); setPhase("loading"); setCompletedAction(null);
    const [previewResult, categoriesResult] = await Promise.all([loadPreviewAction(publication.sourceKey), loadCategoriesAction()]);
    if (!previewResult.ok) { setFailure(previewResult.message); setPhase("error"); return; }
    if (!categoriesResult.ok) { setFailure(categoriesResult.message); setPhase("error"); return; }
    setPreview(previewResult.preview); setCategories(categoriesResult.categories); setCategoryId(categoriesResult.categories[0]?.id); setPhase("configuring");
  }

  function configuredOptions(): ReplicationOptions | null {
    if (categoryId === undefined) { messageApi.error("Seleccioná una categoría."); return null; }
    if (priceMode === "OVERRIDE" && (price === undefined || !Number.isFinite(price) || price <= 0)) { messageApi.error("El precio debe ser mayor que cero."); return null; }
    const normalizedTags = normalizeTags(tags);
    if (tagMode === "OVERRIDE" && normalizedTags.length === 0) { messageApi.error("Agregá al menos un tag."); return null; }
    return { priceMode, tagMode, categoryId, ...(priceMode === "OVERRIDE" && price !== undefined ? { price } : {}), ...(tagMode === "OVERRIDE" ? { tags: normalizedTags } : {}) };
  }

  async function execute(options: ReplicationOptions) {
    if (!selected) return;
    setLastOptions(options); setFailure(null); setPhase("processing");
    const result = await replicateAction(selected.sourceKey, options);
    if (!result.ok) { setFailure(result.message); setPhase("error"); return; }
    setCompletedAction(result.action); setPhase("success");
  }

  const close = () => { if (phase !== "processing") setSelected(null); };

  return <>
    {contextHolder}
    {publications.length === 0 ? <Empty description="No hay publicaciones para replicar." /> : <>
      <div className={styles.list}>{visible.map((publication) => <ReplicationRow key={publication.sourceKey} publication={publication} onReplicate={() => void openReplication(publication)} />)}</div>
      <div ref={sentinelRef} className={styles.sentinel}>{appending ? <Spin size="small" /> : null}</div>
    </>}
    <Modal open={selected !== null} onCancel={close} closable={phase !== "processing"} keyboard={phase !== "processing"} mask={{ closable: phase !== "processing" }} title="Replicar en Tiendanube" footer={modalFooter(phase, () => { const options = configuredOptions(); if (options) void execute(options); }, close, () => { if (lastOptions) void execute(lastOptions); }, () => { setFailure(null); setPhase("configuring"); })}>
      {selected && preview ? <div className={styles.modalHeader}>{preview.thumbnailUrl ? <Image className={styles.modalImage} preview={false} src={preview.thumbnailUrl} alt="" /> : null}<Typography.Title level={4} className={styles.modalTitle}>{preview.title}</Typography.Title></div> : null}
      {phase === "loading" ? <Space direction="vertical" style={{ width: "100%" }}><Skeleton active /><Skeleton active paragraph={{ rows: 2 }} /></Space> : null}
      {phase === "error" ? <Alert className={styles.error} type="error" showIcon message={failure} action={<Button size="small" onClick={() => selected && void openReplication(selected)}>Reintentar</Button>} /> : null}
      {phase === "configuring" && preview ? <ReplicationConfiguration preview={preview} categories={categories} priceMode={priceMode} price={price} tagMode={tagMode} tags={tags} categoryId={categoryId} onPriceModeChange={setPriceMode} onPriceChange={setPrice} onTagModeChange={setTagMode} onTagsChange={setTags} onCategoryChange={setCategoryId} /> : null}
      {phase === "processing" ? <Space direction="vertical" align="center" style={{ width: "100%" }}><Spin size="large" /><Typography.Text>Replicando publicación en Tiendanube...</Typography.Text></Space> : null}
      {phase === "success" ? <Alert type="success" showIcon message="Replicado correctamente en Tiendanube." description={completedAction === "created" ? "Producto creado en Tiendanube." : "Producto actualizado en Tiendanube."} /> : null}
    </Modal>
  </>;
}

function ReplicationRow({ publication, onReplicate }: Readonly<{ publication: ReplicablePublication; onReplicate: () => void }>) {
  return <Card className={styles.row} styles={{ body: { padding: 0 } }}><Button type="primary" onClick={onReplicate}>Replicar TN</Button>{publication.thumbnailUrl ? <img className={styles.image} src={publication.thumbnailUrl} alt="" /> : <div className={styles.image} />}
    <div className={styles.details}><Typography.Text strong className={styles.title}>{publication.title}</Typography.Text><div className={styles.identifiers}>{publication.type === "USER_PRODUCT" ? <><Identifier label="Family ID" value={publication.familyId} /><Identifier label="MLA" value={publication.itemId} /><Identifier label="MLAU" value={publication.userProductId} /></> : <Identifier label="MLA" value={publication.itemId} />}</div></div><Tag className={styles.sold}>{publication.sold} vendidos</Tag></Card>;
}

function Identifier({ label, value }: Readonly<{ label: string; value: string | null }>) {
  return value ? <div className={styles.identifier}><small>{label}</small><CopyableText value={value} label={value} copyLabel={label} /></div> : null;
}

function ReplicationConfiguration({ preview, categories, priceMode, price, tagMode, tags, categoryId, onPriceModeChange, onPriceChange, onTagModeChange, onTagsChange, onCategoryChange }: Readonly<{ preview: ReplicationPreview; categories: readonly TiendanubeCategory[]; priceMode: ReplicationOptions["priceMode"]; price?: number; tagMode: ReplicationOptions["tagMode"]; tags: string[]; categoryId?: number; onPriceModeChange: (value: ReplicationOptions["priceMode"]) => void; onPriceChange: (value: number | undefined) => void; onTagModeChange: (value: ReplicationOptions["tagMode"]) => void; onTagsChange: (value: string[]) => void; onCategoryChange: (value: number) => void }>) {
  return <>
    <section className={styles.section}><h4 className={styles.sectionTitle}>Origen Mercado Libre</h4><Typography.Text>Precio: {formatPrice(preview.priceFrom, preview.priceTo, preview.currency)}</Typography.Text><div className={styles.tags}><Typography.Text>Tags actuales:</Typography.Text>{preview.tags.length > 0 ? preview.tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : <Typography.Text type="secondary">Sin tags</Typography.Text>}</div></section>
    <section className={styles.section}><h4 className={styles.sectionTitle}>Precio</h4><Radio.Group value={priceMode} onChange={(event) => onPriceModeChange(event.target.value)} options={[{ label: "Mantener precio de Mercado Libre", value: "KEEP_SOURCE" }, { label: "Definir otro precio", value: "OVERRIDE" }]} />{priceMode === "OVERRIDE" ? <InputNumber prefix="$" min={0.01} value={price} onChange={(value) => onPriceChange(value ?? undefined)} style={{ width: "100%" }} /> : null}</section>
    <section className={styles.section}><h4 className={styles.sectionTitle}>Tags</h4><Radio.Group value={tagMode} onChange={(event) => onTagModeChange(event.target.value)} options={[{ label: "Mantener tags de Mercado Libre", value: "KEEP_SOURCE" }, { label: "Definir tags", value: "OVERRIDE" }]} />{tagMode === "OVERRIDE" ? <Select mode="tags" tokenSeparators={[","]} value={tags} onChange={onTagsChange} placeholder="Agregar tags" style={{ width: "100%" }} /> : null}</section>
    <section className={styles.section}><h4 className={styles.sectionTitle}>Categoría Tiendanube</h4><Select value={categoryId} onChange={onCategoryChange} options={categories.map((category) => ({ label: category.name, value: category.id }))} placeholder="Seleccionar categoría" style={{ width: "100%" }} /></section>
  </>;
}

function modalFooter(phase: ModalPhase, start: () => void, close: () => void, retry: () => void, back: () => void) {
  if (phase === "loading" || phase === "processing") return null;
  if (phase === "success") return <Button type="primary" onClick={close}>Listo</Button>;
  if (phase === "error") return <Space><Button onClick={back}>Volver</Button><Button type="primary" onClick={retry}>Reintentar</Button></Space>;
  return <Space><Button onClick={close}>Cancelar</Button><Button type="primary" onClick={start}>Replicar</Button></Space>;
}

function formatPrice(from: number | null, to: number | null, currency: string | null) {
  const format = (value: number) => `${currency ? `${currency} ` : "$"}${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value)}`;
  if (from !== null && to !== null && from !== to) return `${format(from)} - ${format(to)}`;
  return format(from ?? to ?? 0);
}

function normalizeTags(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.flatMap((value) => { const trimmed = value.trim(); const key = trimmed.toLocaleLowerCase("es"); if (!key || seen.has(key)) return []; seen.add(key); return [trimmed]; });
}
