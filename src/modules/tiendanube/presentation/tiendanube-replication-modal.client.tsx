"use client";

import { Alert, Button, Image, InputNumber, Modal, Radio, Select, Space, Spin, Tag, Typography, message } from "antd";
import { useEffect, useRef, useState } from "react";

import type { ReplicationOptions, TiendanubeCategory, TiendanubeReplicationAction } from "../domain/tiendanube-replication.model";
import type { ReplicationPreview } from "@/modules/replication/domain/replication.model";

export type ReplicatePublicationAction = (
  sourceKey: string,
  options: ReplicationOptions,
) => Promise<Readonly<{ ok: true; action: TiendanubeReplicationAction } | { ok: false; message: string }>>;

export type ReplicationModalLoadState = "LOADING" | "LOAD_ERROR" | "READY";
type ReplicationPhase = "CONFIGURING" | "PROCESSING" | "SUCCESS" | "REPLICATION_ERROR";

type Props = Readonly<{
  open: boolean;
  sourceKey: string;
  action: ReplicatePublicationAction;
  categories: readonly TiendanubeCategory[];
  preview?: ReplicationPreview | null;
  loadState?: ReplicationModalLoadState;
  loadError?: string | null;
  onLoadRetry?: () => void;
  onGoToIntegrations?: () => void;
  onClose: () => void;
  onResult?: (result: Readonly<{ ok: true; action: TiendanubeReplicationAction } | { ok: false; message: string }>) => void;
}>;

const INTEGRATION_ERROR = "integración con tiendanube no está configurada correctamente";

export function TiendanubeReplicationModal({
  open,
  sourceKey,
  action,
  categories,
  preview = null,
  loadState = "READY",
  loadError = null,
  onLoadRetry,
  onGoToIntegrations,
  onClose,
  onResult,
}: Props) {
  const activeRef = useRef(false);
  const lastOptionsRef = useRef<ReplicationOptions | null>(null);
  const [phase, setPhase] = useState<ReplicationPhase>("CONFIGURING");
  const [priceMode, setPriceMode] = useState<ReplicationOptions["priceMode"]>("KEEP_SOURCE");
  const [price, setPrice] = useState<number>();
  const [tagMode, setTagMode] = useState<ReplicationOptions["tagMode"]>("KEEP_SOURCE");
  const [tags, setTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(categories[0]?.id);
  const [failure, setFailure] = useState<string | null>(null);
  const [completedAction, setCompletedAction] = useState<TiendanubeReplicationAction | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const running = phase === "PROCESSING";

  useEffect(() => {
    if (categoryId === undefined && categories.length > 0) setCategoryId(categories[0]?.id);
  }, [categories, categoryId]);

  useEffect(() => {
    if (open) {
      setPhase("CONFIGURING");
      setFailure(null);
      setCompletedAction(null);
    }
  }, [open]);

  function configuredOptions(): ReplicationOptions | null {
    if (categoryId === undefined) {
      messageApi.error("Seleccioná una categoría.");
      return null;
    }
    if (priceMode === "OVERRIDE" && (price === undefined || !Number.isFinite(price) || price <= 0)) {
      messageApi.error("El precio debe ser mayor que cero.");
      return null;
    }

    const normalizedTags = normalizeTags(tags);
    if (tagMode === "OVERRIDE" && normalizedTags.length === 0) {
      messageApi.error("Agregá al menos un tag.");
      return null;
    }

    return {
      priceMode,
      tagMode,
      categoryId,
      ...(priceMode === "OVERRIDE" && price !== undefined ? { price } : {}),
      ...(tagMode === "OVERRIDE" ? { tags: normalizedTags } : {}),
    };
  }

  async function executeReplication(options: ReplicationOptions): Promise<void> {
    if (activeRef.current) return;
    activeRef.current = true;
    lastOptionsRef.current = options;
    setFailure(null);
    setPhase("PROCESSING");

    try {
      const result = await action(sourceKey, options);
      onResult?.(result);
      if (!result.ok) {
        setFailure(result.message);
        setPhase("REPLICATION_ERROR");
        return;
      }
      setCompletedAction(result.action);
      setPhase("SUCCESS");
    } catch {
      const result = { ok: false as const, message: "No se pudo replicar la publicación en Tiendanube." };
      onResult?.(result);
      setFailure(result.message);
      setPhase("REPLICATION_ERROR");
    } finally {
      activeRef.current = false;
    }
  }

  function startReplication(): void {
    const options = configuredOptions();
    if (options) void executeReplication(options);
  }

  function retryReplication(): void {
    const options = lastOptionsRef.current;
    if (options) void executeReplication(options);
  }

  const isIntegrationError = loadError?.toLocaleLowerCase().includes(INTEGRATION_ERROR) ?? false;
  const modalLoadState = loadState === "READY" ? null : loadState;
  const close = running ? undefined : onClose;

  return <>
    {contextHolder}
    <Modal
      open={open}
      title="Replicar en Tiendanube"
      closable={!running}
      keyboard={!running}
      mask={{ closable: !running }}
      onCancel={close}
      footer={modalFooter({
        loadState: modalLoadState,
        phase,
        close: onClose,
        start: startReplication,
        retry: modalLoadState === "LOAD_ERROR" ? onLoadRetry : retryReplication,
        back: () => { setFailure(null); setPhase("CONFIGURING"); },
        integrationError: isIntegrationError,
        goToIntegrations: onGoToIntegrations,
      })}
    >
      {modalLoadState === "LOADING" ? <Space direction="vertical" style={{ width: "100%" }}><Spin size="large" /><Typography.Text>Cargando información de replicación...</Typography.Text></Space> : null}
      {modalLoadState === "LOAD_ERROR" ? <Alert type={isIntegrationError ? "warning" : "error"} showIcon message={loadError} /> : null}
      {modalLoadState === null && preview ? <div>{preview.thumbnailUrl ? <Image preview={false} src={preview.thumbnailUrl} alt="" /> : null}<Typography.Title level={4}>{preview.title}</Typography.Title></div> : null}
      {modalLoadState === null && phase === "CONFIGURING" ? <ReplicationConfiguration categories={categories} categoryId={categoryId} priceMode={priceMode} price={price} tagMode={tagMode} tags={tags} onCategoryChange={setCategoryId} onPriceChange={setPrice} onPriceModeChange={setPriceMode} onTagModeChange={setTagMode} onTagsChange={setTags} /> : null}
      {modalLoadState === null && phase === "PROCESSING" ? <Space direction="vertical" align="center" style={{ width: "100%" }}><Spin size="large" /><Typography.Text>Replicando publicación...</Typography.Text></Space> : null}
      {modalLoadState === null && phase === "SUCCESS" ? <Alert type="success" showIcon message="Replicado correctamente en Tiendanube." description={completedAction === "created" ? "Producto creado correctamente en Tiendanube." : "Producto actualizado correctamente en Tiendanube."} /> : null}
      {modalLoadState === null && phase === "REPLICATION_ERROR" ? <Alert type="error" showIcon message={failure} /> : null}
    </Modal>
  </>;
}

function ReplicationConfiguration({ categories, categoryId, priceMode, price, tagMode, tags, onCategoryChange, onPriceChange, onPriceModeChange, onTagModeChange, onTagsChange }: Readonly<{
  categories: readonly TiendanubeCategory[];
  categoryId?: number;
  priceMode: ReplicationOptions["priceMode"];
  price?: number;
  tagMode: ReplicationOptions["tagMode"];
  tags: string[];
  onCategoryChange: (value: number) => void;
  onPriceChange: (value: number | undefined) => void;
  onPriceModeChange: (value: ReplicationOptions["priceMode"]) => void;
  onTagModeChange: (value: ReplicationOptions["tagMode"]) => void;
  onTagsChange: (value: string[]) => void;
}>) {
  return <>
    <p>¿Mantener precio de Mercado Libre?</p>
    <Radio.Group value={priceMode === "KEEP_SOURCE"} onChange={(event) => onPriceModeChange(event.target.value ? "KEEP_SOURCE" : "OVERRIDE")} options={[{ label: "Sí", value: true }, { label: "No", value: false }]} />
    {priceMode === "OVERRIDE" ? <InputNumber aria-label="Precio" prefix="$" min={0.01} value={price} onChange={(value) => onPriceChange(value ?? undefined)} style={{ width: "100%", marginTop: 12 }} /> : null}
    <p>¿Mantener tags de Mercado Libre?</p>
    <Radio.Group value={tagMode === "KEEP_SOURCE"} onChange={(event) => onTagModeChange(event.target.value ? "KEEP_SOURCE" : "OVERRIDE")} options={[{ label: "Sí", value: true }, { label: "No", value: false }]} />
    {tagMode === "OVERRIDE" ? <Select mode="tags" aria-label="Tags" tokenSeparators={[","]} placeholder="Agregar tags" value={tags} onChange={onTagsChange} style={{ width: "100%", marginTop: 12 }} /> : null}
    <Select aria-label="Categoría" placeholder="Seleccionar categoría" value={categoryId} onChange={onCategoryChange} options={categories.map((category) => ({ label: category.name, value: category.id }))} style={{ width: "100%", marginTop: 12 }} />
  </>;
}

function modalFooter({ loadState, phase, close, start, retry, back, integrationError, goToIntegrations }: Readonly<{
  loadState: ReplicationModalLoadState | null;
  phase: ReplicationPhase;
  close: () => void;
  start: () => void;
  retry?: () => void;
  back: () => void;
  integrationError: boolean;
  goToIntegrations?: () => void;
}>) {
  if (loadState === "LOADING" || phase === "PROCESSING") return null;
  if (loadState === "LOAD_ERROR") {
    if (integrationError) return <Space><Button onClick={close}>Cerrar</Button><Button type="primary" onClick={goToIntegrations}>Ir a Integraciones</Button></Space>;
    return <Space><Button onClick={close}>Cerrar</Button><Button type="primary" onClick={retry}>Reintentar</Button></Space>;
  }
  if (phase === "SUCCESS") return <Button type="primary" onClick={close}>Listo</Button>;
  if (phase === "REPLICATION_ERROR") return <Space><Button onClick={back}>Volver</Button><Button type="primary" onClick={retry}>Reintentar</Button></Space>;
  return <Space><Button onClick={close}>Cancelar</Button><Button type="primary" onClick={start}>Replicar</Button></Space>;
}

function normalizeTags(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    const trimmed = value.trim();
    const key = trimmed.toLocaleLowerCase("es");
    if (!key || seen.has(key)) return [];
    seen.add(key);
    return [trimmed];
  });
}
