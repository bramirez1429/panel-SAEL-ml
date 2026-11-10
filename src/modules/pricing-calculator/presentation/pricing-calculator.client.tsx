"use client";

import { useMemo, useState } from "react";
import {
  Alert, Button, Card, Col, Collapse, Divider, Input, InputNumber, Radio, Row,
  Space, Statistic, Table, Tag, Typography,
} from "antd";

import {
  MONEY, PAYMENTS, PRODUCTS, SETTINGS, financingRate, minimumInstallmentAmount,
  mlQuote, recommendedML, recommendedTN, tnQuote,
  type Installments, type Product, type Provider, type Quote, type Settings,
} from "../domain/pricing-calculator";
import styles from "./pricing-calculator.module.css";

const { Text, Title, Paragraph } = Typography;

type PlanCount = 2 | 3 | 6;
type CardProvider = "pagoNube" | "mercadoPago" | "nave" | "mercadoLibre";
type SixRates = Record<CardProvider, number | null>;
const SIX_DEFAULT_RATES: SixRates = {
  pagoNube: null,
  mercadoPago: 18.69 * 1.21,
  nave: null,
  mercadoLibre: null,
};
const CARD_PROVIDERS: ReadonlyArray<{ id: CardProvider; title: string }> = [
  { id: "pagoNube", title: "Pago Nube" },
  { id: "mercadoPago", title: "Mercado Pago en Tiendanube" },
  { id: "nave", title: "NAVE en Tiendanube" },
  { id: "mercadoLibre", title: "Mercado Libre" },
];

// No se inventa la tasa de 6 cuotas de una cuenta: el valor de Mercado Pago
// es una referencia pública de LINK DE PAGO, no una confirmación de Checkout.
function planRate(provider: CardProvider, plan: PlanCount, settings: Settings, six: SixRates): number | null {
  if (plan === 6) return six[provider];
  if (provider === "mercadoLibre") return plan === 2 ? settings.mlFinancing2 : settings.mlFinancing3;
  return financingRate(provider, plan, settings);
}

function quoteForPlan(
  product: Product, settings: Settings, provider: CardProvider, plan: PlanCount,
  six: SixRates, minimumSix: number, listOverride?: number,
): Quote | null {
  const list = listOverride ?? (provider === "mercadoLibre" ? product.mercadoLibreList : product.tiendaNubeList);
  if (plan !== 6) {
    return provider === "mercadoLibre"
      ? mlQuote(product, settings, plan, list)
      : tnQuote(list, product.cost, provider, settings, plan);
  }
  const rate = six[provider];
  if (rate === null) return null;
  const one = provider === "mercadoLibre"
    ? mlQuote(product, settings, 1, list)
    : tnQuote(list, product.cost, provider, settings, 1);
  if (!one || one.productPrice < minimumSix) return null;
  const additionalFee = (provider === "mercadoLibre" ? one.productPrice : one.totalCustomer) * rate / 100;
  return {
    ...one,
    financeFee: additionalFee,
    rate: one.rate + rate,
    profit: one.profit - additionalFee,
    // QuoteDetails no se usa en la vista de 6 cuotas; ésta muestra el plazo real.
    installments: 3,
  };
}

function recommendedPlanList(
  product: Product, settings: Settings, provider: CardProvider, plan: PlanCount,
  six: SixRates, minimumSix: number,
): number | null {
  if (planRate(provider, plan, settings, six) === null) return null;
  const current = provider === "mercadoLibre" ? product.mercadoLibreList : product.tiendaNubeList;
  const one = provider === "mercadoLibre"
    ? mlQuote(product, settings, 1)
    : tnQuote(product.tiendaNubeList, product.cost, provider, settings, 1);
  const desired = Math.max(product.targetProfit, one?.profit ?? product.targetProfit);
  const currentQuote = quoteForPlan(product, settings, provider, plan, six, minimumSix);
  if (currentQuote && currentQuote.profit >= desired) return current;
  for (let list = Math.ceil(Math.max(0, current) / 100) * 100; list <= 400000; list += 100) {
    const simulated = quoteForPlan(product, settings, provider, plan, six, minimumSix, list);
    if (simulated && simulated.profit >= desired) return list;
  }
  return null;
}

function FinancingPlanOption({ p, s, plan, provider, six, minimumSix, onChange }: Readonly<{
  p: Product; s: Settings; plan: PlanCount; provider: CardProvider;
  six: SixRates; minimumSix: number; onChange: (patch: Partial<Product>) => void;
}>) {
  const rate = planRate(provider, plan, s, six);
  const one = provider === "mercadoLibre"
    ? mlQuote(p, s, 1)
    : tnQuote(p.tiendaNubeList, p.cost, provider, s, 1);
  const quote = quoteForPlan(p, s, provider, plan, six, minimumSix);
  const suggestedList = recommendedPlanList(p, s, provider, plan, six, minimumSix);
  const isML = provider === "mercadoLibre";
  const currentList = isML ? p.mercadoLibreList : p.tiendaNubeList;
  const suggestedFinal = suggestedList === null ? null : Math.round(suggestedList * (1 - s.discount / 100));
  const currentFinal = Math.round(currentList * (1 - s.discount / 100));
  const gainLost = one && quote ? one.profit - quote.profit : null;
  const title = CARD_PROVIDERS.find((x) => x.id === provider)?.title ?? provider;
  const financingText = rate === null
    ? "Tasa no confirmada"
    : isML
      ? formatRate(rate) + " cargado (IVA según liquidación de ML)"
      : formatRate(rate / 1.21) + " + IVA (21%) = " + formatRate(rate) + " final";
  const min = plan === 6 ? minimumSix : minimumInstallmentAmount(plan);
  const knownButIneligible = rate !== null && !quote && currentFinal < min;
  const canApply = suggestedList !== null && suggestedList > currentList;

  return <div className={styles.paymentBox} style={{ display: "grid", gap: 9, height: "auto" }}>
    <Text strong>{title}</Text>
    <div style={{ padding: "8px 10px", borderRadius: 8, background: "#f7f3ff", display: "grid", gap: 3 }}>
      <Text style={{ fontSize: 12 }}>Financiación: <strong>{financingText}</strong></Text>
      {provider === "mercadoPago" ? <Text type="secondary" style={{ fontSize: 11 }}>Referencia pública de Link de Pago: verificá la tasa de Checkout.</Text> : null}
      <Text style={{ fontSize: 12 }}>
        Comisión de cobro y plataforma: <strong>{one ? formatRate(one.rate) : "Pendiente"}</strong>
      </Text>
      <Text style={{ fontSize: 12 }}>Descuento total por cobro + financiación: <strong>{quote ? formatRate(quote.rate) : "Sin cálculo confirmado"}</strong></Text>
    </div>
    {quote ? <>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span><Text type="secondary" style={{ fontSize: 11 }}>Cliente paga</Text><div><strong>{MONEY.format(quote.totalCustomer)}</strong></div></span>
        <span><Text type="secondary" style={{ fontSize: 11 }}>Cuota aproximada</Text><div><strong>{MONEY.format(quote.totalCustomer / plan)}</strong></div></span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span><Text type="secondary" style={{ fontSize: 11 }}>Financiación que absorbe SAEL</Text><div><strong>{MONEY.format(quote.financeFee)}</strong></div></span>
        <span><Text type="secondary" style={{ fontSize: 11 }}>Ganancia si NO modificás</Text><div><Gain value={quote.profit} target={p.targetProfit} /></div></span>
      </div>
      <Text type="secondary" style={{ fontSize: 12 }}>Reducción frente a 1 pago: <strong>{gainLost === null ? "Sin comparar" : MONEY.format(gainLost)}</strong></Text>
    </> : <Text type="secondary" style={{ fontSize: 12 }}>
      {rate === null ? "Completá la tasa con IVA en Configuración para calcular el precio y la ganancia."
        : knownButIneligible ? "El producto aún no alcanza el mínimo de " + MONEY.format(min) + " para estas cuotas."
          : "La financiación no está disponible con estos parámetros."}
    </Text>}
    <div style={{ borderTop: "1px solid #e7e5ee", paddingTop: 9, display: "grid", gap: 5 }}>
      <Text type="secondary" style={{ fontSize: 11 }}>Precio de lista recomendado para mantener tu ganancia de 1 pago (o tu objetivo, si es mayor)</Text>
      <strong style={{ fontSize: 21, color: "#583080" }}>{suggestedList === null ? "Pendiente de tasa" : MONEY.format(suggestedList)}</strong>
      {suggestedFinal !== null ? <Text style={{ fontSize: 12 }}>Precio final del producto con {s.discount}% OFF: <strong>{MONEY.format(suggestedFinal)}</strong>
        {suggestedFinal > currentFinal ? " · sube " + MONEY.format(suggestedFinal - currentFinal) : " · ya alcanza"}</Text> : null}
      <Button
        block
        type="primary"
        disabled={!canApply}
        onClick={() => {
          if (suggestedList !== null) onChange(isML
            ? { mercadoLibreList: suggestedList }
            : { tiendaNubeList: suggestedList });
        }}
      >{canApply ? "Modificar" : suggestedList === null ? "Falta tasa" : "El precio ya alcanza"}</Button>
      <Text type="secondary" style={{ fontSize: 11 }}>
        Modificar cambia sólo el precio de lista de esta card ({isML ? "Mercado Libre" : "Tiendanube"}) en el simulador, no el precio publicado.
      </Text>
    </div>
  </div>;
}


// Sólo ajusta la experiencia de la calculadora: no altera ni cobra pedidos reales.
// Tarifas conocidas: 7 días Pago Nube 4,39% + IVA, transferencia 1,50% + IVA,
// Mercado Pago Checkout 10 días 4,39% + IVA y Tiendanube Esencial extra 2%.
// Las tasas de cuotas sin contrato verificado quedan SIN CONFIRMAR.
const SAEL_DEFAULT_SETTINGS: Settings = {
  ...SETTINGS,
  freeShippingFrom: 90000,
  freeShippingBag: 1300,
  naveOne: 5.8 * 1.21,
  mercadoPagoFinancing2: 7.79 * 1.21,
  mercadoPagoFinancing3: 10.49 * 1.21,
  pagoNubeFinancing2: null,
  pagoNubeFinancing3: null,
  naveFinancing2: null,
  naveFinancing3: null,
  mlFinancing2: null,
  mlFinancing3: null,
};

function formatRate(rate: number): string {
  return rate.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}

function financingExplanation(rate: number | null, mercadoLibre = false): string {
  if (rate === null) return "Financiación pendiente: cargá la tasa de tu cuenta en Configuración";
  if (mercadoLibre) return formatRate(rate) + " adicional (confirmá IVA y programa de cuotas de ML)";
  return formatRate(rate / 1.21) + " + IVA (21%) = " + formatRate(rate) + " adicional";
}

type MoneyInputProps = Readonly<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}>;

function MoneyInput({ label, value, onChange, min = 0 }: MoneyInputProps) {
  return <label className={styles.field}><span>{label}</span>
    <InputNumber
      className={styles.input}
      min={min}
      max={50000000}
      step={100}
      value={value}
      onChange={(value) => onChange(Math.max(min, value ?? 0))}
      addonBefore="$"
      controls={false}
    />
  </label>;
}

function RateInput({ label, value, onChange }: Readonly<{
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}>) {
  return <label className={styles.field}><span>{label}</span>
    <InputNumber
      className={styles.input}
      min={0}
      max={100}
      step={0.1}
      value={value}
      placeholder="Sin confirmar"
      onChange={onChange}
      addonAfter="%"
      controls={false}
    />
  </label>;
}

function Gain({ value, target, n = 1 }: Readonly<{ value: number; target: number; n?: number }>) {
  return <span className={value / n >= target ? styles.gain : styles.low}>
    <strong>{MONEY.format(value)}</strong>
    {n > 1 ? <small>{MONEY.format(value / n)} por prenda</small> : null}
    {value / n < target ? <small>Por debajo de tu objetivo</small> : null}
  </span>;
}

type SalesChannel = "tiendanube" | "mercadoLibre";

function QuoteDetails({ quote, target, n = 1, showShipping = true, channel = "tiendanube" }: Readonly<{
  quote: Quote | null;
  target: number;
  n?: number;
  showShipping?: boolean;
  channel?: SalesChannel;
}>) {
  if (!quote) return <Text type="secondary">No disponible: monto mínimo o tasa de financiación sin configurar.</Text>;

  // Tiendanube cobra sobre productos + envío; Mercado Libre cobra su comisión sobre el producto.
  // La logística y el cargo fijo de ML se muestran también como porcentaje equivalente del precio de venta.
  const mercadoLibre = channel === "mercadoLibre";
  const base = mercadoLibre ? quote.productPrice : quote.totalCustomer;
  const share = (amount: number): string =>
    base > 0 ? (amount / base * 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%" : "—";
  const fees = quote.processingFee + quote.platformFee + quote.financeFee;
  const allChannelCosts = fees + (mercadoLibre ? quote.fixedFee + quote.shippingExpense : 0);

  return <div className={styles.quote}>
    <div className={styles.quoteTop}>
      <span><Text type="secondary">Cliente paga</Text><strong>{MONEY.format(quote.totalCustomer)}</strong></span>
      <span><Text type="secondary">Ganancia SAEL</Text><Gain value={quote.profit} target={target} n={n} /></span>
    </div>
    <div style={{ display: "grid", gap: 7, background: "#f7f7fb", border: "1px solid #e9e8f1", padding: 12, borderRadius: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Text strong style={{ fontSize: 12 }}>{mercadoLibre ? "Total ML: comisión + cargos + logística" : "Total comisiones del cobro"}</Text>
        <Tag color="purple" style={{ margin: 0, fontWeight: 700 }}>{share(allChannelCosts)}</Tag>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
        <span>{mercadoLibre ? "Comisión Mercado Libre" : "Comisión de la pasarela"}</span>
        <strong>{share(quote.processingFee)} · {MONEY.format(quote.processingFee)}</strong>
      </div>
      {!mercadoLibre ? <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
        <span>Comisión adicional Tiendanube</span>
        <strong>{share(quote.platformFee)} · {MONEY.format(quote.platformFee)}</strong>
      </div> : null}
      {(quote.financeFee > 0 || quote.installments > 1) ? <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
        <span>Financiación de cuotas</span>
        <strong>{share(quote.financeFee)} · {MONEY.format(quote.financeFee)}</strong>
      </div> : null}
      {mercadoLibre ? <>
        {quote.fixedFee > 0 ? <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
          <span>Cargo fijo equivalente</span>
          <strong>{share(quote.fixedFee)} · {MONEY.format(quote.fixedFee)}</strong>
        </div> : null}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
          <span>Envío ML equivalente</span>
          <strong>{share(quote.shippingExpense)} · {MONEY.format(quote.shippingExpense)}</strong>
        </div>
      </> : null}
      <div style={{ borderTop: "1px solid #e6e4ed", paddingTop: 7, display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
        <strong>{mercadoLibre ? "Total descontado a SAEL" : "Total comisión y financiación"}</strong>
        <strong>{MONEY.format(allChannelCosts)}</strong>
      </div>
      <Text type="secondary" style={{ fontSize: 11 }}>
        {mercadoLibre
          ? "Porcentajes efectivos sobre el precio de venta. Envío y cargo fijo se expresan como equivalentes, no como comisiones porcentuales."
          : "Porcentajes sobre el pago total, incluido el envío cuando lo abona el comprador. Pago Nube bonifica el adicional de Tiendanube."}
      </Text>
    </div>
    <div className={styles.meta}>
      <span>Producto(s): {MONEY.format(quote.productPrice)}</span>
      {showShipping ? <span>{quote.freeShipping ? "Envío gratis para el comprador" : "Envío cobrado al comprador: " + MONEY.format(quote.shippingCharged)}</span> : null}
      {quote.bagExpense > 0 ? <span>Friselina extra: {MONEY.format(quote.bagExpense)}</span> : null}
    </div>
    {quote.installments > 1 ? <Text type="secondary">{quote.installments} pagos de {MONEY.format(quote.totalCustomer / quote.installments)}</Text> : null}
  </div>;
}

function PriceProduct({ p, s, six, minimumSix, onChange }: Readonly<{
  p: Product; s: Settings; six: SixRates; minimumSix: number;
  onChange: (patch: Partial<Product>) => void;
}>) {
  const [selectedInstallments, setSelectedInstallments] = useState<PlanCount | null>(null);
  const transfer = tnQuote(p.tiendaNubeList, p.cost, "transferencia", s);
  const pn1 = tnQuote(p.tiendaNubeList, p.cost, "pagoNube", s);
  const ml1 = mlQuote(p, s, 1);
  const suggestedTn = recommendedTN(p, { ...s, installments: 1 });
  const suggestedMl = recommendedML(p, { ...s, installments: 1 });
  const recommendedTransfer = suggestedTn === null ? null : tnQuote(suggestedTn, p.cost, "transferencia", s);
  const afterDiscount = Math.round(p.tiendaNubeList * (1 - s.discount / 100));

  return <Card className={styles.productCard} title={<div className={styles.cardTitle}>
    <Input aria-label="Nombre de producto" value={p.name} onChange={(e) => onChange({ name: e.target.value })} />
    <Tag color="purple">Costo: {MONEY.format(p.cost)}</Tag>
  </div>}>
    <Row gutter={[12, 12]}>
      <Col xs={24} sm={12}>
        <MoneyInput label="Costo completo de la prenda" value={p.cost} onChange={(cost) => onChange({ cost })} />
      </Col>
      <Col xs={24} sm={12}>
        <MoneyInput label="Quiero ganar por prenda" value={p.targetProfit} onChange={(targetProfit) => onChange({ targetProfit })} />
      </Col>
      <Col xs={24} sm={12}>
        <MoneyInput label="Precio de lista Tiendanube" value={p.tiendaNubeList} onChange={(tiendaNubeList) => onChange({ tiendaNubeList })} />
      </Col>
      <Col xs={24} sm={12}>
        <MoneyInput label="Precio de lista Mercado Libre" value={p.mercadoLibreList} onChange={(mercadoLibreList) => onChange({ mercadoLibreList })} />
      </Col>
    </Row>
    <div style={{ marginTop: 16, padding: 14, border: "1px solid #ddd5ee", borderRadius: 12, background: "#fbf9ff", display: "grid", gap: 9 }}>
      <Text strong>Simular financiación · elegí solo una opción</Text>
      <Radio.Group
        value={selectedInstallments ?? 1}
        onChange={(e) => {
          const value = Number(e.target.value);
          setSelectedInstallments(value === 1 ? null : value as PlanCount);
        }}
        options={[
          { label: "1 pago · sin financiación", value: 1 },
          { label: "2 cuotas desde $25.000", value: 2 },
          { label: "3 cuotas desde $32.000", value: 3 },
          { label: minimumSix ? "6 cuotas desde " + MONEY.format(minimumSix) : "6 cuotas · mínimo configurable", value: 6 },
        ]}
      />
      <Text type="secondary" style={{ fontSize: 12 }}>
        Seleccionar otro plazo reemplaza al anterior. Se muestra una sola simulación por producto con comisión, IVA, ganancia y precio sugerido. No activa cuotas en tus publicaciones.
      </Text>
    </div>
    <div className={styles.recommendations}>
      <div>
        <Text type="secondary">Lista sugerida · Tiendanube</Text>
        <strong>{suggestedTn === null ? "No calculable" : MONEY.format(suggestedTn)}</strong>
        <small>Referencia de 1 pago y transferencia{recommendedTransfer ? " (transferencia a " + MONEY.format(recommendedTransfer.productPrice) + ")" : ""}. Para 2, 3 y 6 cuotas usá las sugerencias individuales.</small>
      </div>
      <div>
        <Text type="secondary">Lista sugerida · Mercado Libre</Text>
        <strong>{suggestedMl === null ? "Tasa pendiente" : MONEY.format(suggestedMl)}</strong>
        <small>Referencia de 1 pago. Las sugerencias de 2, 3 y 6 cuotas se muestran en cada plan.</small>
      </div>
    </div>
    <Divider>Tiendanube</Divider>
    <div className={styles.priceRow}>
      <div><Text type="secondary">Precio con {s.discount}% OFF</Text><Title level={4}>{MONEY.format(afterDiscount)}</Title></div>
      <Tag color="green">Transferencia +{s.transferDiscount}% OFF</Tag>
    </div>
    <Row gutter={[12, 12]}>
      <Col xs={24} md={12}>
        <div className={styles.paymentBox}>
          <Text strong>Pago Nube · 1 pago</Text>
          <QuoteDetails quote={pn1} target={p.targetProfit} />
        </div>
      </Col>
      <Col xs={24} md={12}>
        <div className={styles.paymentBox + " " + styles.transferBox}>
          <Text strong>Pago Nube · transferencia</Text>
          <QuoteDetails quote={transfer} target={p.targetProfit} />
        </div>
      </Col>
    </Row>
    <Collapse
      className={styles.collapse}
      ghost
      items={[{
        key: "payments",
        label: "Comparar Pago Nube, Mercado Pago y NAVE · 1 pago",
        children: <div className={styles.paymentGrid}>
          {PAYMENTS.map((provider) => <div className={styles.paymentBox} key={provider.key}>
            <Text strong>{provider.label} · 1 pago</Text>
            <QuoteDetails quote={tnQuote(p.tiendaNubeList, p.cost, provider.key, s, 1)} target={p.targetProfit} />
          </div>)}
        </div>,
      }]}
    />
    <Divider>Mercado Libre</Divider>
    <div className={styles.paymentBox}>
      <Text strong>Venta en 1 pago</Text>
      <QuoteDetails quote={ml1} target={p.targetProfit} showShipping={false} channel="mercadoLibre" />
      <Text type="secondary">Logística a cargo de SAEL: {MONEY.format(ml1?.shippingExpense ?? 0)}</Text>
    </div>
    {(selectedInstallments === null ? [] : [selectedInstallments]).map((n) => <Card
      key={"cuotas-" + n}
      size="small"
      style={{ marginTop: 14, borderColor: "#e3d3ef" }}
      title={n + " cuotas · financiación y precio sugerido"}
    >
      <Text type="secondary" style={{ display: "block", marginBottom: 10, fontSize: 12 }}>
        {n === 6 && !minimumSix
          ? "6 cuotas: no definiste un mínimo de compra; revisá la elegibilidad en cada medio."
          : "Monto mínimo de productos después del descuento: " + MONEY.format(n === 6 ? minimumSix : minimumInstallmentAmount(n))}
      </Text>
      <div className={styles.paymentGrid}>
        {CARD_PROVIDERS.map((provider) => <FinancingPlanOption
          key={n + provider.id}
          p={p}
          s={s}
          plan={n}
          provider={provider.id}
          six={six}
          minimumSix={minimumSix}
          onChange={onChange}
        />)}
      </div>
    </Card>)}
    <Row gutter={[12, 12]} className={styles.productFooter}>
      <Col xs={12} sm={8}><MoneyInput label="Cargo fijo ML (< $33.000)" value={p.mlFixedFee} onChange={(mlFixedFee) => onChange({ mlFixedFee })} /></Col>
      <Col xs={12} sm={8}><MoneyInput label="Envío ML (≥ $33.000)" value={p.mlShipping} onChange={(mlShipping) => onChange({ mlShipping })} /></Col>
      <Col xs={24} sm={8}><MoneyInput label="Cantidad en carrito" value={p.quantity} onChange={(quantity) => onChange({ quantity: Math.floor(quantity) })} /></Col>
    </Row>
    <Text type="secondary" className={styles.note}>El costo informado incluye estampado, packaging habitual, luz e IIBB. No se vuelven a restar.</Text>
  </Card>;
}

type CartRow = { key: string; label: string; amount: number };
function Cart({ products, settings }: Readonly<{ products: Product[]; settings: Settings }>) {
  const selected = products.filter((p) => p.quantity > 0);
  const list = selected.reduce((acc, p) => acc + p.quantity * p.tiendaNubeList, 0);
  const cost = selected.reduce((acc, p) => acc + p.quantity * p.cost, 0);
  const pieces = selected.reduce((acc, p) => acc + p.quantity, 0);
  const tnCard = tnQuote(list, cost, "pagoNube", settings);
  const transfer = tnQuote(list, cost, "transferencia", settings);
  const rows: CartRow[] = selected.map((p) => ({ key: p.id, label: p.name + " × " + p.quantity, amount: p.tiendaNubeList * p.quantity }));

  return <Card title="Simulador de carrito y envío gratis">
    {pieces === 0 ? <Alert type="info" showIcon message="Elegí la cantidad de cada producto para simular un pedido real." /> : <>
      <Table<CartRow>
        className={styles.cartTable}
        size="small"
        pagination={false}
        columns={[{ title: "Producto", dataIndex: "label", key: "label" }, { title: "Lista", dataIndex: "amount", key: "amount", render: (value: number) => MONEY.format(value), align: "right" }]}
        dataSource={rows}
      />
      <div className={styles.cartStats}>
        <div className={styles.paymentBox}><Text strong>Pago Nube · tarjeta</Text><QuoteDetails quote={tnCard} target={0} n={pieces} /></div>
        <div className={styles.paymentBox + " " + styles.transferBox}><Text strong>Transferencia · 20% extra</Text><QuoteDetails quote={transfer} target={0} n={pieces} /></div>
      </div>
      <Alert
        showIcon
        type={tnCard?.freeShipping || transfer?.freeShipping ? "success" : "info"}
        message="Envío gratis desde " 
        description={"Umbral: " + MONEY.format(settings.freeShippingFrom) + " después de descuentos. Se evalúa por separado para tarjeta y transferencia. Cuando corresponde SAEL absorbe el envío y la friselina extra."}
      />
    </>}
  </Card>;
}

function SettingsPanel({ settings, six, onSixChange, minimumSix, onMinimumSixChange, onChange }: Readonly<{
  settings: Settings;
  six: SixRates;
  onSixChange: (provider: CardProvider, rate: number | null) => void;
  minimumSix: number;
  onMinimumSixChange: (value: number) => void;
  onChange: (patch: Partial<Settings>) => void;
}>) {
  return <Collapse items={[{
    key: "settings",
    label: "Configuración de comisiones, envío y financiación (editable)",
    children: <>
      <Paragraph type="secondary">
        Los porcentajes incluyen IVA cuando corresponde. La comisión del 2% de Tiendanube se agrega a Mercado Pago y NAVE, pero no a Pago Nube.
        Las tasas de financiación vacías no están confirmadas y NO se utilizan para calcular ganancias. Mercado Pago 2 y 3 cuotas usa tasas públicas referenciales: verificá su vigencia para Checkout de tu cuenta. Modificá todos los porcentajes según el panel de cada proveedor.
      </Paragraph>
      <div className={styles.settingsGrid}>
        <MoneyInput label="Envío estimado" value={settings.shipping} onChange={(shipping) => onChange({ shipping })} />
        <MoneyInput label="Envío gratis desde" value={settings.freeShippingFrom} onChange={(freeShippingFrom) => onChange({ freeShippingFrom })} />
        <MoneyInput label="Friselina adicional con envío gratis" value={settings.freeShippingBag} onChange={(freeShippingBag) => onChange({ freeShippingBag })} />
        <RateInput label="20% extra transferencia" value={settings.transferDiscount} onChange={(transferDiscount) => onChange({ transferDiscount: transferDiscount ?? 0 })} />
        <RateInput label="Pago Nube 1 pago (IVA incluido)" value={settings.pagoNubeOne} onChange={(pagoNubeOne) => onChange({ pagoNubeOne: pagoNubeOne ?? 0 })} />
        <RateInput label="Pago Nube transferencia (IVA incluido)" value={settings.transferencia} onChange={(transferencia) => onChange({ transferencia: transferencia ?? 0 })} />
        <RateInput label="Mercado Pago 1 pago (IVA incluido)" value={settings.mercadoPagoOne} onChange={(mercadoPagoOne) => onChange({ mercadoPagoOne: mercadoPagoOne ?? 0 })} />
        <RateInput label="NAVE 1 pago (IVA incluido)" value={settings.naveOne} onChange={(naveOne) => onChange({ naveOne: naveOne ?? 0 })} />
        <RateInput label="Extra Tiendanube al usar otras pasarelas" value={settings.tiendaNubeThirdParty} onChange={(tiendaNubeThirdParty) => onChange({ tiendaNubeThirdParty: tiendaNubeThirdParty ?? 0 })} />
        <RateInput label="Mercado Libre comisión base" value={settings.mlCommission} onChange={(mlCommission) => onChange({ mlCommission: mlCommission ?? 0 })} />
      </div>
      <MoneyInput label="Mínimo opcional para 6 cuotas (0 = no definido)" value={minimumSix} onChange={onMinimumSixChange} />
      <Divider>Financiación extra · sin incluir comisión de cobro · IVA incluido</Divider>
      <div className={styles.settingsGrid}>
        {([
          ["pagoNubeFinancing2", "Pago Nube 2 cuotas"],
          ["pagoNubeFinancing3", "Pago Nube 3 cuotas (confirmar cuenta)"],
          ["mercadoPagoFinancing2", "Mercado Pago 2 cuotas (referencia pública)"],
          ["mercadoPagoFinancing3", "Mercado Pago 3 cuotas (referencia pública)"],
          ["naveFinancing2", "NAVE 2 cuotas"],
          ["naveFinancing3", "NAVE 3 cuotas (confirmar cuenta)"],
          ["mlFinancing2", "Mercado Libre 2 cuotas"],
          ["mlFinancing3", "Mercado Libre 3 cuotas (confirmar publicación)"],
        ] as const).map(([key, label]) => <RateInput key={key} label={label} value={settings[key]} onChange={(rate) => onChange({ [key]: rate })} />)}
      </div>
      <Divider>6 cuotas · financiación adicional con IVA incluido</Divider>
      <div className={styles.settingsGrid}>
        {CARD_PROVIDERS.map((provider) => <RateInput
          key={provider.id}
          label={provider.title + " · 6 cuotas"}
          value={six[provider.id]}
          onChange={(value) => onSixChange(provider.id, value)}
        />)}
      </div>
      <Text type="secondary" style={{ display: "block", marginTop: 8, fontSize: 12 }}>
        Mercado Pago 2, 3 y 6 cuotas usa como referencia pública los costos de Link de Pago
        (7,79%, 10,49% y 18,69% antes del IVA, respectivamente). No implica que sean
        idénticos a Checkout de Tiendanube. Pago Nube, NAVE y Mercado Libre requieren
        tasas exactas de tu cuenta/publicación, por eso comienzan sin tasa.
      </Text>
    </>,
  }]} />;
}

export function PricingCalculator() {
  const [products, setProducts] = useState<Product[]>(() => PRODUCTS.map((p) => ({ ...p })));
  const [settings, setSettings] = useState<Settings>({ ...SAEL_DEFAULT_SETTINGS });
  const [sixRates, setSixRates] = useState<SixRates>({ ...SIX_DEFAULT_RATES });
  const [minimumSix, setMinimumSix] = useState(0);
  const changeProduct = (id: string, patch: Partial<Product>) =>
    setProducts((previous) => previous.map((p) => p.id === id ? { ...p, ...patch } : p));
  const changeSettings = (patch: Partial<Settings>) => setSettings((previous) => ({ ...previous, ...patch }));
  const selectedProduct = useMemo(() => products.reduce((count, p) => count + p.quantity, 0), [products]);

  return <div className={styles.root} data-dashboard-full-width="true">
    <div className={styles.heading}>
      <div>
        <Tag color="purple">SAEL · Herramienta de rentabilidad</Tag>
        <Title level={2}>Calculadora de Mercado Libre y Tiendanube</Title>
        <Paragraph type="secondary">
          Definí cuánto te cuesta producir y cuánto querés ganar. Calculamos el precio sugerido, las comisiones y la contribución real de cada venta.
        </Paragraph>
      </div>
      <Button onClick={() => { setProducts(PRODUCTS.map((p) => ({ ...p }))); setSettings({ ...SAEL_DEFAULT_SETTINGS }); setSixRates({ ...SIX_DEFAULT_RATES }); setMinimumSix(0); }}>Restablecer valores SAEL</Button>
    </div>
    <Card className={styles.controls}>
      <Space wrap size="large">
        <div><Text strong>Promoción</Text><div className={styles.control}>
          <Radio.Group
            value={settings.discount}
            onChange={(e) => changeSettings({ discount: e.target.value as Settings["discount"] })}
            optionType="button"
            buttonStyle="solid"
            options={[{ value: 10, label: "10% OFF" }, { value: 15, label: "15% OFF" }, { value: 20, label: "20% OFF" }]}
          />
        </div></div>
        <Text type="secondary">1 pago siempre visible. Elegí un solo plazo de financiación por producto: 2, 3 o 6 cuotas.</Text>
        <Statistic title="Envío gratis desde" value={settings.freeShippingFrom} precision={0} prefix="$" groupSeparator="." />
        <Statistic title="Prendas del carrito" value={selectedProduct} />
      </Space>
      <Alert showIcon type="info" className={styles.tips}
        message="Los precios sugeridos son estimativos, no actualizan publicaciones."
        description="Se contempla el 20% extra de transferencia, la promoción seleccionada, IVA en las comisiones y envío gratis desde $90.000. El precio sugerido se calcula para alcanzar tu ganancia objetivo en las pasarelas con tasas configuradas." />
    </Card>
    <SettingsPanel
      settings={settings}
      six={sixRates}
      onSixChange={(provider, rate) => setSixRates((previous) => ({ ...previous, [provider]: rate }))}
      minimumSix={minimumSix}
      onMinimumSixChange={setMinimumSix}
      onChange={changeSettings}
    />
    <div className={styles.productGrid}>
      {products.map((p) => <PriceProduct key={p.id} p={p} s={settings} six={sixRates} minimumSix={minimumSix} onChange={(patch) => changeProduct(p.id, patch)} />)}
    </div>
    <Cart products={products} settings={settings} />
    <Card size="small">
      <Text type="secondary">Los costos precargados ($7.100, $12.000, $21.000, $17.000, $20.000) ya incluyen DTF, luz, packaging habitual e IIBB estimado. No se descuentan de nuevo. SAEL ofrece envío gratis desde $90.000 después de descuentos y suma una friselina adicional de $1.300 por pedido con envío gratis. Mercado Libre puede aplicar otros cargos según logística, categoría o financiación; usá el simulador de tu publicación para ajustarlos. Esta herramienta no reemplaza la liquidación real ni calcula los gastos fijos mensuales.</Text>
    </Card>
  </div>;
}
