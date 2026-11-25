"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Checkbox, Empty, Input, Segmented, Skeleton, Tag } from "antd";
import { ClockCircleOutlined, PictureOutlined, ReloadOutlined } from "@ant-design/icons";
import Image from "next/image";
import { argentinaDate, money } from "../operations/sales-operations.model";
import { filterShipments, logisticsLabel, shipmentsSchema, shippingStatus, stages, dailyShipmentFilters, selectDailyShipments, preparationStatus, type DailyShipmentFilter, type Shipment, type ShipmentsData, type ShipmentStageFilter } from "./shipments.model";
import styles from "../operations/sales-operations.module.css";
import local from "./shipments.module.css";

function ShipmentCard({ shipment, busy, disabled, onComplete }: Readonly<{
  shipment: Shipment; busy: ReadonlySet<string>; disabled: boolean;
  onComplete: (orderId: string, value: boolean) => void;
}>) {
  const prep = preparationStatus(shipment);
  const cancelled = prep === "CANCELLED";
  const pending = !cancelled && (["TODAY","UPCOMING","OVERDUE"].includes(shipment.stage) ||
    (shipment.stage === "REVIEW" && ["pending","handling","ready_to_ship"].includes(shipment.status ?? "")));
  const prepared = prep === "COMPLETED";
  const finalized = !cancelled && shipment.stage === "FINISHED";
  const late = shipment.stage === "OVERDUE" || (pending && shipment.deadline && Date.parse(shipment.deadline) < Date.now());
  return <article className={styles.orderCard}>
    <div className={styles.orderTop}>
      <div className={styles.orderIdentity}>
        <Tag color="gold">Mercado Libre</Tag><Tag color="blue">{logisticsLabel(shipment.logistic)}</Tag>
        <strong>{shipment.shipmentId ? "Envío #" + shipment.shipmentId : "Pedido sin envío asociado"}</strong>
        <small>{shipment.orders.length} pedido(s)</small>
      </div>
      <Tag color={cancelled ? "error" : finalized || prepared ? "success" : "gold"}>{cancelled ? "Cancelada" : finalized ? shippingStatus(shipment) : prepared ? "Preparación completada" : "Preparación pendiente"}</Tag>
    </div>
    <div className={local.deadline} data-late={Boolean(late)}>
      <ClockCircleOutlined />
      <div><strong>{shippingStatus(shipment)}</strong>
        <div>{shipment.terminalAt ? (cancelled ? "Cancelada: " : "Finalizada: ") + argentinaDate(shipment.terminalAt) : shipment.deadline ? "Despachar hasta: " + argentinaDate(shipment.deadline) + " hs" : "Sin plazo de despacho informado"}</div>
        {late ? <small>Plazo vencido</small> : null}
        {shipment.issue ? <small>{shipment.issue}</small> : null}
      </div>
    </div>
    {shipment.orders.map(order => <div key={order.orderId} className={local.order}>
      <div className={styles.orderTop}>
        <strong>Pedido #{order.orderId}</strong><small>Venta: {argentinaDate(order.soldAt)}</small>
      </div>
      {order.lines.map(line => <div className={styles.line} key={line.key}>
        <div className={styles.photo}>
          {line.imageUrl?.startsWith("https://") ? <Image src={line.imageUrl} alt={line.title} width={66} height={76} unoptimized className={styles.photoImage} /> : <PictureOutlined aria-label="Sin imagen" />}
        </div>
        <div className={styles.lineInfo}>
          <strong>{line.title}</strong>
          <small>{[line.color,line.size,line.sku].filter(Boolean).join(" · ") || "Sin atributos informados"}</small>
          <small>{line.quantity} unidad(es) · {money(line.unitPrice, line.currency)} por unidad</small>
        </div>
      </div>)}
      {!cancelled && !finalized && !order.cancelled && (pending || prepared || shipment.stage === "TRANSIT") ? <Checkbox checked={Boolean(order.completedAt)} disabled={disabled || busy.has(order.orderId)}
        onChange={event => onComplete(order.orderId, event.target.checked)}>{busy.has(order.orderId) ? "Guardando..." : order.completedAt ? "Preparación completada" : "Marcar pedido preparado"}</Checkbox> : null}
    </div>)}
  </article>;
}

export function ShipmentsWorkspace() {
  const [data, setData] = useState<ShipmentsData | null>(null);
  const [stage, setStage] = useState<ShipmentStageFilter>("TODAY");
  const [preparation, setPreparation] = useState<DailyShipmentFilter>("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Set<string>>(() => new Set());
  const active = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/sales/shipments", { cache: "no-store", signal: controller.signal });
      if (!response.ok || response.redirected) throw new Error("Consulta no disponible");
      const parsed = shipmentsSchema.parse(await response.json());
      if (!controller.signal.aborted) setData(parsed);
    } catch {
      if (!controller.signal.aborted) setError("No se pudieron consultar los envíos. Verificá tu conexión a Mercado Libre y reintentá.");
    } finally {
      if (active.current === controller) { active.current = null; setLoading(false); }
    }
  }, []);
  useEffect(() => { void refresh(); return () => active.current?.abort(); }, [refresh]);

  const complete = async (orderId: string, completed: boolean) => {
    if (busy.has(orderId) || loading) return;
    setBusy(current => new Set(current).add(orderId)); setSaveError(null);
    try {
      const response = await fetch("/api/sales/shipments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, completed }) });
      if (!response.ok || response.redirected || (await response.json()).ok !== true) throw new Error("save");
      setData(current => current ? { ...current, shipments: current.shipments.map(s => ({ ...s,
        orders: s.orders.map(o => o.orderId === orderId ? { ...o, completedAt: completed ? new Date().toISOString() : null } : o)
      })) } : current);
    } catch { setSaveError("No se pudo guardar el pedido. No se modificó su estado en Mercado Libre."); }
    finally { setBusy(current => { const next = new Set(current); next.delete(orderId); return next; }); }
  };

  const daily = useMemo(() => data ? selectDailyShipments(data.shipments, data.today) : [], [data]);
  const counts = useMemo(() => Object.fromEntries(stages.map(s => [s.value, s.value === "TODAY" ? daily.length :
    data?.shipments.filter(p => s.value === "ALL" || p.stage === s.value).length ?? 0])), [data, daily]);
  const prepCounts = useMemo(() => Object.fromEntries(dailyShipmentFilters.map(f => [f.value,
    data ? selectDailyShipments(daily, data.today, f.value).length : 0])), [data, daily]);
  const results = useMemo(() => stage === "TODAY"
    ? filterShipments(data ? selectDailyShipments(daily, data.today, preparation) : [], "ALL", query)
    : filterShipments(data?.shipments ?? [], stage, query),
  [data, daily, stage, query, preparation]);
  return <main className={styles.workspace} data-dashboard-full-width="true">
    <section className={styles.panel}>
      <div className={styles.heading}><div><span className={styles.eyebrow}>PREPARACIÓN Y DESPACHO</span><h2>{stages.find(s => s.value === stage)?.label}</h2></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <Input.Search className={local.search} placeholder="Buscar pedido, envío, SKU o producto" value={query} onChange={e => setQuery(e.target.value)} allowClear />
        <Button type="primary" icon={<ReloadOutlined />} loading={loading} disabled={busy.size > 0} onClick={() => void refresh()}>Actualizar envíos</Button>
        </div></div>
      {error ? <Alert showIcon type="error" title={error} /> : null}
      {data?.truncated || data?.unparsed ? <Alert showIcon type="warning" title="Consulta parcial" description="Hay órdenes fuera del límite o sin datos interpretables; los totales pueden estar incompletos." /> : null}
      {data?.preparationUnavailable ? <Alert showIcon type="warning" title="No se pudo leer la preparación guardada. Los cambios están deshabilitados." /> : null}
      {data?.cancellationUnavailable ? <Alert showIcon type="warning" title="No se pudieron recuperar todas las cancelaciones registradas." /> : null}
      <div className={local.tabs}>
        <Segmented<ShipmentStageFilter> value={stage} onChange={value => { setStage(value); setPreparation("ALL"); }} options={stages.map(s => ({
          value: s.value, label: <span className={local.tab}>{s.label}<b>{data ? counts[s.value] : "—"}</b></span>
        }))}/>
      </div>
      {stage === "TODAY" ? <div className={local.tabs}>
        <Segmented<DailyShipmentFilter> value={preparation} onChange={setPreparation} options={dailyShipmentFilters.map(f => ({
          value: f.value,
          disabled: Boolean(data?.preparationUnavailable) && (f.value === "PENDING" || f.value === "COMPLETED"),
          label: <span className={local.tab}>{f.label}<b>{data && !(data.preparationUnavailable && (f.value === "PENDING" || f.value === "COMPLETED")) ? prepCounts[f.value] : "—"}</b></span>
        }))}/>
      </div> : null}
      <div className={styles.resultHeader}><span>{data ? results.length + " envío(s) / grupo(s)" : "Envíos"}</span><small>Ordenados por plazo de despacho</small></div>
      <small className={styles.muted}>{data ? "Consultado " + argentinaDate(data.fetchedAt) + " · Hora argentina · Órdenes de los últimos " + data.days + " días" : "Consultando Mercado Libre"}</small>
      {saveError ? <Alert showIcon type="error" title={saveError} /> : null}
      {loading && !data ? <Skeleton active paragraph={{ rows: 6 }} /> :
        !data && error ? <Empty description="No hay datos disponibles" /> :
        !results.length ? <Empty description="No hay envíos para esta selección." /> :
        <div className={styles.orderList}>{results.map(s => <ShipmentCard key={s.key} shipment={s} busy={busy} disabled={loading || Boolean(data?.preparationUnavailable)} onComplete={(id,value) => void complete(id,value)} />)}</div>}
    </section>
  </main>;
}
