"use client";

import { useMemo, useState } from "react";
import { Alert, Badge, Button, Checkbox, Empty, Input, Popover, Segmented, Select, Skeleton, Tag } from "antd";
import { BellOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, InboxOutlined, ReloadOutlined, ShoppingCartOutlined, ArrowRightOutlined, PictureOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { useSalesOperations } from "./sales-operations-provider.client";
import { syncMercadoLibreSalesAction } from "./sales-operations.actions";
import { argentinaDate, argentinaOrderDay, channelLabel, money, selectSalesOrders, summarizeSalesOrders, salesPeriodLabels, type SaleOrder, type SalesOperations, type SalesPeriod, type SalesChannelFilter } from "./sales-operations.model";
import { SaleVariants } from "../presentation/sale-variants.client";
import styles from "./sales-operations.module.css";

const orderKey = (order: SaleOrder) => order.channel + ":" + order.orderId;

const statusLabels: Record<SaleOrder["status"], string> = {
  PENDING: "Pendiente", COMPLETED: "Completada", CANCELLED: "Cancelada",
};
const statusColors: Record<SaleOrder["status"], string> = {
  PENDING: "gold", COMPLETED: "success", CANCELLED: "error",
};

export function SalesNotifications() {
  const { data, error, loading, read, refresh } = useSalesOperations();
  const [open, setOpen] = useState(false);
  const notices = data?.orders.filter((order) => order.unread).slice(0, 8) ?? [];
  return (
    <Popover placement="bottomRight" trigger="click" open={open} onOpenChange={setOpen}
      content={<div className={styles.notifications}>
        <div className={styles.noticeHeader}>
          <div><strong>Notificaciones</strong><p>Ventas nuevas sin leer</p></div>
          <Button type="text" icon={<ReloadOutlined />} onClick={() => void refresh()} aria-label="Actualizar notificaciones" />
        </div>
        {error ? <Alert type="warning" showIcon title="No se pudieron actualizar los avisos." /> : null}
        {loading && !data ? <Skeleton active paragraph={{ rows: 2 }} /> :
          notices.length ? notices.map((order) => (
            <Link key={orderKey(order)} className={styles.noticeItem}
              href={"/ventas?order=" + encodeURIComponent(orderKey(order))}
              onClick={() => { void read(order); setOpen(false); }}>
              <span className={styles.noticeIcon}><ShoppingCartOutlined /></span>
              <span><strong>{order.lines[0]?.productName ?? "Nuevo pedido"}</strong>
                <small>{channelLabel(order.channel)} · #{order.orderId}</small>
                <small>{argentinaDate(order.soldAt)}</small></span>
            </Link>
          )) : <p className={styles.muted}>{error ? "No hay datos actualizados." : "Estás al día con tus notificaciones."}</p>}
        <Link className={styles.noticeFooter} href="/ventas" onClick={() => setOpen(false)}>Ver todas las ventas <ArrowRightOutlined /></Link>
      </div>}>
      <Badge count={data?.summary.unread ?? 0} overflowCount={99} offset={[-3, 4]}>
        <Button className={styles.bell} type="text" shape="circle" icon={<BellOutlined />}
          aria-label={data ? "Notificaciones de ventas: " + data.summary.unread + " sin leer" : "Notificaciones de ventas"} />
      </Badge>
    </Popover>
  );
}

function Metrics({ summary, loading, salesLabel }: Readonly<{ summary?: SalesOperations["summary"]; loading: boolean; salesLabel: string }>) {
  const metrics = [
    { label: salesLabel, value: summary?.sales, icon: <ShoppingCartOutlined />, tone: "blue" },
    { label: "Pendientes", value: summary?.pending, icon: <ClockCircleOutlined />, tone: "amber" },
    { label: "Completadas", value: summary?.completed, icon: <CheckCircleOutlined />, tone: "green" },
    { label: "Canceladas", value: summary?.cancelled, icon: <CloseCircleOutlined />, tone: "rose" },
  ];
  return <div className={styles.metrics}>
    {metrics.map((metric) => <div className={styles.metric} key={metric.label}>
      <span className={styles.metricIcon} data-tone={metric.tone}>{metric.icon}</span>
      <div><span className={styles.metricLabel}>{metric.label}</span>
        {loading && !summary ? <Skeleton.Input active size="small" style={{ width: 60 }} /> :
          <strong className={styles.metricValue}>{metric.value ?? "—"}</strong>}
      </div>
    </div>)}
  </div>;
}

export function SalesHomeSummary({ period = "today", scopedSummary, inWorkspace = false }: Readonly<{ period?: SalesPeriod; scopedSummary?: SalesOperations["summary"]; inWorkspace?: boolean }> = {}) {
  const { data, error, loading, refresh } = useSalesOperations();
  const summary = inWorkspace ? scopedSummary : data?.summary;
  const heading = period === "today" ? "Ventas de hoy" : period === "yesterday" ? "Ventas de ayer" : `Ventas · ${salesPeriodLabels[period].toLowerCase()}`;
  return <section className={styles.panel} aria-label={heading}>
    <div className={styles.heading}>
      <div><span className={styles.eyebrow}>CENTRO DE VENTAS</span><h2>{heading}</h2>
        <p>Controlá los pedidos de tus dos canales en un solo lugar.</p></div>
      {inWorkspace ? <Tag>{salesPeriodLabels[period]}</Tag> : <Link className={styles.primaryLink} href="/ventas">Ver ventas <ArrowRightOutlined /></Link>}
    </div>
    <Metrics summary={summary} loading={loading} salesLabel={period === "today" ? "Ventas de hoy" : "Total de ventas"} />
    <div className={styles.channelSummary}>
      <span><i className={styles.mlDot}/> Mercado Libre <strong>{summary?.ml ?? "—"}</strong></span>
      <span><i className={styles.tnDot}/> Tienda Nube <strong>{summary?.tn ?? "—"}</strong></span>
      <small>Hora argentina · {loading ? "Cargando..." : "Actualización cada 30 s"}</small>
    </div>
    {error ? <Alert type="warning" showIcon title={error} action={<Button size="small" onClick={() => void refresh()}>Reintentar</Button>} /> : null}
  </section>;
}

function Photo({ src, alt }: Readonly<{ src: string | null; alt: string }>) {
  const [failed, setFailed] = useState(false);
  return <div className={styles.photo}>
    {src?.startsWith("https://") && !failed ? <Image src={src} alt={alt} width={66} height={76} unoptimized
      onError={() => setFailed(true)} className={styles.photoImage} /> : <PictureOutlined aria-label="Sin foto disponible" />}
  </div>;
}

function OrderCard({ order, initialOpen = false }: Readonly<{ order: SaleOrder; initialOpen?: boolean }>) {
  const { complete } = useSalesOperations();
  const [expanded, setExpanded] = useState(initialOpen);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState(false);
  const [override, setOverride] = useState<boolean | null>(null);
  const checked = override ?? order.status === "COMPLETED";
  const toggle = async (value: boolean) => {
    setSaving(true); setFailure(false); setOverride(value);
    const success = await complete(order, value);
    setOverride(null); setSaving(false);
    if (!success) setFailure(true);
  };
  return <article className={styles.orderCard} data-status={order.status}>
    <div className={styles.orderTop}>
      <div className={styles.orderIdentity}>
        <Tag className={styles.channelTag} color={order.channel === "MERCADOLIBRE" ? "gold" : "blue"}>{channelLabel(order.channel)}</Tag>
        <strong>Pedido #{order.orderId}</strong>
        {order.unread ? <span className={styles.newLabel}>Nueva</span> : null}
        <small>{argentinaDate(order.soldAt)}</small>
      </div>
      <Tag color={statusColors[order.status]}>{statusLabels[order.status]}</Tag>
    </div>
    <div className={styles.orderMain}>
      <div className={styles.productPreview}>
        <Photo key={order.lines[0]?.imageUrl ?? orderKey(order)} src={order.lines[0]?.imageUrl ?? null} alt={order.lines[0]?.productName ?? "Producto"} />
        <div><strong>{order.lines[0]?.productName ?? "Pedido"}</strong>
          <p>{order.lines.length > 1 ? "+" + (order.lines.length - 1) + " producto(s) más · " : ""}{order.quantity} unidad(es)</p>
          <small>{[order.lines[0]?.color, order.lines[0]?.size, order.lines[0]?.sku].filter(Boolean).join(" · ") || "Sin atributos"}</small>
        </div>
      </div>
      <div className={styles.orderAmount}><span>Importe de productos</span><strong>{money(order.amount, order.currency)}</strong>
        {order.buyer ? <small>{order.buyer}</small> : null}</div>
    </div>
    <div className={styles.orderActions}>
      <Checkbox checked={checked} disabled={saving || order.status === "CANCELLED"} onChange={(event) => void toggle(event.target.checked)}>
        {order.status === "CANCELLED" ? "Pedido cancelado" : saving ? "Guardando..." : checked ? "Preparación completada" : "Marcar como completada"}
      </Checkbox>
      <Button type="link" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
        {expanded ? "Ocultar detalle" : "Ver detalle"}
      </Button>
    </div>
    {failure ? <Alert type="error" showIcon title="No se pudo guardar el estado. Reintentá." /> : null}
    {expanded ? <div className={styles.orderDetails}>
      <div className={styles.detailFacts}>
        <span>Comprador: <strong>{order.buyer ?? "Sin dato"}</strong></span>
        <span>Pago: <strong>{order.status === "CANCELLED" ? "Pedido cancelado" : "Pagado"}</strong></span>
        <span>Envío: <strong>{order.shippingStatus ?? "Sin dato"}</strong></span>
        {order.completedAt ? <span>Completada: <strong>{argentinaDate(order.completedAt)}</strong></span> : null}
      </div>
      {order.lines.map((line) => <div className={styles.line} key={line.id}>
        <Photo key={line.imageUrl ?? line.id} src={line.imageUrl} alt={line.productName} />
        <div className={styles.lineInfo}><strong>{line.productName}</strong>
          <small>{[line.color, line.size].filter(Boolean).join(" · ") || "Sin atributos"}</small>
          <small>SKU: {line.sku ?? "Sin SKU"} · Cantidad: {line.quantity}</small>
          <small>Precio unitario: {money(line.unitPrice, order.currency)}</small>
          {order.status !== "CANCELLED" ? <SaleVariants saleId={line.id} /> : null}
        </div>
      </div>)}
    </div> : null}
  </article>;
}

type Filter = "ALL" | SaleOrder["status"];
export function SalesWorkspace({ focusOrder }: Readonly<{ focusOrder?: string }>) {
  const { data, error, loading, refresh } = useSalesOperations();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [channel, setChannel] = useState<SalesChannelFilter>("ALL");
  const [period, setPeriod] = useState<SalesPeriod>(focusOrder ? "month" : "week");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ type: "success" | "warning" | "error"; message: string } | null>(null);
  const syncMercadoLibre = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncNotice(null);
    try {
      const result = await syncMercadoLibreSalesAction();
      if (!result.ok) {
        setSyncNotice({ type: "error", message: "No se pudo consultar la API de Mercado Libre. Revisá la conexión." });
        return;
      }
      const refreshed = await refresh();
      setSyncNotice({
        type: result.failed || !refreshed ? "warning" : "success",
        message: "Mercado Libre (48 h): " + result.found + " órdenes encontradas, " +
          result.processed + " consultas procesadas y " + result.failed + " errores." +
          (!refreshed ? " No se pudo actualizar el listado guardado." : ""),
      });
    } catch {
      setSyncNotice({ type: "error", message: "No se pudo completar la sincronización." });
    } finally {
      setSyncing(false);
    }
  };

  const scoped = useMemo(() => data ? selectSalesOrders(data.orders, data.today || argentinaOrderDay(new Date().toISOString()), period, channel, search) : [], [data, period, channel, search]);
  const summary = useMemo(() => data ? summarizeSalesOrders(scoped) : undefined, [data, scoped]);
  const results = useMemo(() => scoped.filter((order) => filter === "ALL" || order.status === filter), [scoped, filter]);

  return <main className={styles.workspace} data-dashboard-full-width="true">
    <SalesHomeSummary period={period} scopedSummary={summary} inWorkspace />
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div><span className={styles.eyebrow}>GESTIÓN DE PEDIDOS</span><h2>Todas tus ventas</h2>
          <p>Marcá una venta cuando ya esté preparada. El estado de envío no cambia en las plataformas.</p></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button icon={<ReloadOutlined />} onClick={() => void refresh()}>Actualizar listado</Button>
          <Button type="primary" icon={<ReloadOutlined />} loading={syncing}
            onClick={() => void syncMercadoLibre()}>Sincronizar Mercado Libre</Button>
        </div>
      </div>
      {syncNotice ? <Alert showIcon type={syncNotice.type} title={syncNotice.message} /> : null}
      <div className={styles.filters}>
        <Segmented<Filter> value={filter} onChange={setFilter} options={[
          { label: "Todas", value: "ALL" }, { label: "Pendientes", value: "PENDING" },
          { label: "Completadas", value: "COMPLETED" }, { label: "Canceladas", value: "CANCELLED" },
        ]}/>
        <div className={styles.filterControls}>
          <Select<SalesPeriod> value={period} onChange={setPeriod} options={[
            { value: "today", label: "Hoy" }, { value: "yesterday", label: "Ayer" }, { value: "week", label: "Últimos 7 días" }, { value: "month", label: "Últimos 31 días" },
          ]} aria-label="Período" />
          <Select<SalesChannelFilter> value={channel} onChange={setChannel} options={[
            { value: "ALL", label: "Todos los canales" }, { value: "MERCADOLIBRE", label: "Mercado Libre" }, { value: "TIENDANUBE", label: "Tienda Nube" },
          ]} aria-label="Canal" />
          <Input allowClear value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pedido, producto o SKU" aria-label="Buscar ventas" />
        </div>
      </div>
      <div className={styles.resultHeader}><span>{data ? results.length + " pedido(s)" : "Pedidos"}</span><small>{data ? `${scoped.length} pedidos en el período · ${data.orders.length} disponibles en ${data.days} días · ` : ""}Ordenados por fecha de venta</small></div>
      {loading && !data ? <Skeleton active paragraph={{ rows: 5 }} /> :
        !data && error ? <Alert type="error" showIcon title={error} /> :
        !results.length ? <Empty image={<InboxOutlined style={{ fontSize: 42 }} />} description={period === "today" ? "No hay pedidos registrados hoy. Seleccioná Últimos 7 días para ver las ventas anteriores." : "No hay pedidos para estos filtros."} /> :
        <div className={styles.orderList}>{results.map((order) => <OrderCard key={orderKey(order)} order={order} initialOpen={orderKey(order) === focusOrder} />)}</div>}
    </section>
  </main>;
}
