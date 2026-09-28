"use client";

import {
  Alert,
  Button,
  InputNumber,
  message,
  Modal,
  Progress,
  Radio,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { useEffect, useRef, useState } from "react";

import type {
  ReplicationOptions,
  TiendanubeCategory,
  TiendanubeReplicationAction,
  TiendanubeReplicationState,
} from "../domain/tiendanube-replication.model";

export type ReplicatePublicationAction = (
  sourceKey: string,
  options: ReplicationOptions,
) => Promise<Readonly<
  | { ok: true; action: TiendanubeReplicationAction }
  | { ok: false; message: string }
>>;

export type GetTiendanubeReplicationStateAction = (
  sourceKey: string,
) => Promise<TiendanubeReplicationState>;

type Props = Readonly<{
  sourceKey: string;
  initialState: TiendanubeReplicationState;
  action: ReplicatePublicationAction;
  categories?: readonly TiendanubeCategory[];
  getStateAction?: GetTiendanubeReplicationStateAction;
}>;

type ReplicationPhase = "CONFIGURING" | "PROCESSING" | "SUCCESS" | "ERROR";

/** Isla cliente para configurar la réplica; autenticación y HTTP permanecen en el servidor. */
export function TiendanubeReplicationCell({
  sourceKey,
  initialState,
  action,
  categories = [],
  getStateAction,
}: Props) {
  const activeRef = useRef(false);
  const lastOptionsRef = useRef<ReplicationOptions | null>(null);
  const [state, setState] = useState(initialState);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<ReplicationPhase>("CONFIGURING");
  const [priceMode, setPriceMode] = useState<ReplicationOptions["priceMode"]>("KEEP_SOURCE");
  const [price, setPrice] = useState<number>();
  const [tagMode, setTagMode] = useState<ReplicationOptions["tagMode"]>("KEEP_SOURCE");
  const [tags, setTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>(categories[0]?.id);
  const [failure, setFailure] = useState<string | null>(null);
  const [completedAction, setCompletedAction] = useState<TiendanubeReplicationAction | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const mantenerPrecio = priceMode === "KEEP_SOURCE";
  const running = phase === "PROCESSING";

  useEffect(() => {
    if (initialState.status !== "UNKNOWN" || !getStateAction) return;
    let active = true;

    void getStateAction(sourceKey).then((nextState) => {
      if (active) setState(nextState);
    });

    return () => {
      active = false;
    };
  }, [getStateAction, initialState.status, sourceKey]);

  function openModal(): void {
    setPhase("CONFIGURING");
    setFailure(null);
    setCompletedAction(null);
    setOpen(true);
  }

  function configuredOptions(): ReplicationOptions | null {
    if (categoryId === undefined) {
      messageApi.error("Seleccioná una categoría.");
      return null;
    }
    if (priceMode === "OVERRIDE" && (
      price === undefined || !Number.isFinite(price) || price <= 0
    )) {
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

  async function startReplication(): Promise<void> {
    const options = configuredOptions();
    if (!options) return;
    lastOptionsRef.current = options;
    await executeReplication(options);
  }

  async function retryReplication(): Promise<void> {
    const options = lastOptionsRef.current;
    if (!options) return;
    await executeReplication(options);
  }

  async function executeReplication(options: ReplicationOptions): Promise<void> {
    if (activeRef.current) return;

    activeRef.current = true;
    setPhase("PROCESSING");
    setFailure(null);

    try {
      const result = await action(sourceKey, options);
      if (!result.ok) {
        setFailure(result.message);
        setState((current) => ({ ...current, status: "FAILED" }));
        setPhase("ERROR");
        return;
      }

      setCompletedAction(result.action);
      setState((current) => ({ ...current, sourceKey, status: "COMPLETED" }));
      setPhase("SUCCESS");
    } catch {
      setFailure("No se pudo replicar la publicación en Tiendanube.");
      setState((current) => ({ ...current, status: "FAILED" }));
      setPhase("ERROR");
    } finally {
      activeRef.current = false;
    }
  }

  const modal = (
    <Modal
      open={open}
      title="Replicar en Tiendanube"
      closable={!running}
      keyboard={!running}
      mask={{ closable: !running }}
      onCancel={running ? undefined : () => setOpen(false)}
      footer={modalFooter({
        phase,
        close: () => setOpen(false),
        start: () => void startReplication(),
        retry: () => void retryReplication(),
        back: () => {
          setFailure(null);
          setPhase("CONFIGURING");
        },
      })}
    >
      {phase === "CONFIGURING" ? (
        <ReplicationConfiguration
          categories={categories}
          categoryId={categoryId}
          mantenerPrecio={mantenerPrecio}
          price={price}
          tagMode={tagMode}
          tags={tags}
          onCategoryChange={setCategoryId}
          onPriceChange={setPrice}
          onPriceModeChange={setPriceMode}
          onTagModeChange={setTagMode}
          onTagsChange={setTags}
        />
      ) : (
        <TiendanubeReplicationProgress
          phase={phase}
          action={completedAction}
          error={failure}
          family={sourceKey.startsWith("family:")}
        />
      )}
    </Modal>
  );

  if (state.status === "PENDING") {
    return <>{contextHolder}<span>Procesando...</span></>;
  }
  if (state.status === "UNKNOWN") {
    return <>{contextHolder}<span>Verificando estado...</span></>;
  }
  if (state.status === "COMPLETED") {
    return <>{contextHolder}{modal}<Tag color="green">✓ Replicado</Tag></>;
  }

  return (
    <>
      {contextHolder}
      {modal}
      <Button
        danger={state.status === "FAILED"}
        onClick={openModal}
        size="small"
      >
        {state.status === "FAILED" ? "Reintentar" : "Replicar TN"}
      </Button>
    </>
  );
}

function ReplicationConfiguration({
  categories,
  categoryId,
  mantenerPrecio,
  price,
  tagMode,
  tags,
  onCategoryChange,
  onPriceChange,
  onPriceModeChange,
  onTagModeChange,
  onTagsChange,
}: Readonly<{
  categories: readonly TiendanubeCategory[];
  categoryId: number | undefined;
  mantenerPrecio: boolean;
  price: number | undefined;
  tagMode: ReplicationOptions["tagMode"];
  tags: string[];
  onCategoryChange: (value: number) => void;
  onPriceChange: (value: number | undefined) => void;
  onPriceModeChange: (value: ReplicationOptions["priceMode"]) => void;
  onTagModeChange: (value: ReplicationOptions["tagMode"]) => void;
  onTagsChange: (value: string[]) => void;
}>) {
  return (
    <>
      <p>¿Mantener precio de Mercado Libre?</p>
      <Radio.Group
        aria-label="Mantener precio de Mercado Libre"
        value={mantenerPrecio}
        onChange={(event) => onPriceModeChange(event.target.value ? "KEEP_SOURCE" : "OVERRIDE")}
        options={[{ label: "Sí", value: true }, { label: "No", value: false }]}
      />
      {!mantenerPrecio ? (
        <InputNumber
          aria-label="Precio"
          prefix="$"
          min={0.01}
          value={price}
          onChange={(value) => onPriceChange(value ?? undefined)}
          style={{ width: "100%", marginTop: 12 }}
          formatter={(value) => value === undefined ? "" : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
          parser={(value) => Number((value ?? "").replace(/\./g, ""))}
        />
      ) : null}
      <p>¿Mantener tags de Mercado Libre?</p>
      <Radio.Group
        aria-label="Mantener tags de Mercado Libre"
        value={tagMode === "KEEP_SOURCE"}
        onChange={(event) => onTagModeChange(event.target.value ? "KEEP_SOURCE" : "OVERRIDE")}
        options={[{ label: "Sí", value: true }, { label: "No", value: false }]}
      />
      {tagMode === "OVERRIDE" ? (
        <Select
          mode="tags"
          aria-label="Tags"
          tokenSeparators={[","]}
          placeholder="Agregar tags"
          value={tags}
          onChange={onTagsChange}
          style={{ width: "100%", marginTop: 12 }}
        />
      ) : null}
      <Select
        aria-label="Categoría"
        placeholder="Seleccionar categoría"
        value={categoryId}
        onChange={onCategoryChange}
        options={categories.map((category) => ({ label: category.name, value: category.id }))}
        style={{ width: "100%", marginTop: 12 }}
      />
    </>
  );
}

function TiendanubeReplicationProgress({
  phase,
  action,
  error,
  family,
}: Readonly<{
  phase: Exclude<ReplicationPhase, "CONFIGURING">;
  action: TiendanubeReplicationAction | null;
  error: string | null;
  family: boolean;
}>) {
  const success = phase === "SUCCESS";
  const failed = phase === "ERROR";
  const percent = success ? 100 : 75;
  const text = success
    ? action === "updated"
      ? "Producto actualizado correctamente en Tiendanube."
      : "Producto creado correctamente en Tiendanube."
    : failed
      ? error ?? "No se pudo replicar la publicación en Tiendanube."
      : family
        ? "Replicando publicación y variantes..."
        : "Replicando publicación...";

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Progress
        percent={percent}
        steps={4}
        status={success ? "success" : failed ? "exception" : "active"}
      />
      {failed ? (
        <Alert showIcon type="error" title={text} />
      ) : (
        <Typography.Text strong={success} type={success ? "success" : undefined}>
          {success ? `✓ ${text}` : text}
        </Typography.Text>
      )}
      {!success && !failed ? (
        <Typography.Text type="secondary">Esto puede tardar unos segundos.</Typography.Text>
      ) : null}
    </Space>
  );
}

function modalFooter({
  phase,
  close,
  start,
  retry,
  back,
}: Readonly<{
  phase: ReplicationPhase;
  close: () => void;
  start: () => void;
  retry: () => void;
  back: () => void;
}>) {
  if (phase === "PROCESSING") return null;
  if (phase === "SUCCESS") {
    return <Button type="primary" onClick={close}>Listo</Button>;
  }
  if (phase === "ERROR") {
    return (
      <Space>
        <Button onClick={back}>Volver</Button>
        <Button type="primary" onClick={retry}>Reintentar</Button>
      </Space>
    );
  }
  return (
    <Space>
      <Button onClick={close}>Cancelar</Button>
      <Button type="primary" onClick={start}>Replicar</Button>
    </Space>
  );
}

function normalizeTags(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLocaleLowerCase("es");
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(trimmed);
    }
  }
  return result;
}
