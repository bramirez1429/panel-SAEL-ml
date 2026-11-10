"use client";

import { useMemo, useState } from "react";
import {
  Alert, Button, Card, Checkbox, Col, Collapse, Divider, Input, InputNumber, Radio, Row,
  Space, Statistic, Table, Tag, Typography,
} from "antd";

import {
  MONEY, PAYMENTS, PRODUCTS, SETTINGS, financingRate, minimumInstallmentAmount,
  mlQuote, recommendedML, recommendedTN, tnQuote,
  type Installments, type Product, type Provider, type Quote, type Settings,
} from "../domain/pricing-calculator";
import styles from "./pricing-calculator.module.css";

const { Text, Title, Paragraph } = Typography;

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

function ExtraFinancingCost({ one, installment, profitTarget }: Readonly<{
  one: Quote | null;
  installment: Quote | null;
  profitTarget: number;
}>) {
  if (!one || !installment) return null;
  const additionalCost = Math.max(0, one.profit - installment.profit);
  const netRate = 1 - installment.rate / 100;
  const extraFinalPrice = netRate > 0 ? additionalCost / netRate : null;
  return <div style={{ background: "#fff8ed", padding: 10, borderRadius: 8, fontSize: 12, marginTop: 8, display: "grid", gap: 4 }}>
    <strong>¿Cuánto se encarece ofrecer cuotas?</strong>
    <span>Costo extra de financiación para SAEL: <strong>{MONEY.format(additionalCost)}</strong></span>
    <span>Ganancia que perdés respecto a 1 pago: <strong>{MONEY.format(additionalCost)}</strong></span>
    <span>Para conservar la misma ganancia, subir el precio final aproximadamente: <strong>{extraFinalPrice === null ? "No calculable" : MONEY.format(extraFinalPrice)}</strong></span>
    {installment.profit < profitTarget ? <Text type="danger">Queda por debajo de tu ganancia objetivo.</Text> : null}
  </div>;
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

function PriceProduct({ p, s, onChange }: Readonly<{
  p: Product; s: Settings; onChange: (patch: Partial<Product>) => void;
}>) {
  const [visibleInstallments, setVisibleInstallments] = useState<Installments[]>([]);
  const toggleInstallments = (n: Installments, checked: boolean) => {
    setVisibleInstallments((previous) => checked
      ? [...previous.filter((x) => x !== n), n].sort()
      : previous.filter((x) => x !== n));
  };
  const verifiedTNPlans = visibleInstallments.filter((n) =>
    PAYMENTS.every((provider) => financingRate(provider.key, n, s) !== null));
  const suggestedTNOptions = [
    recommendedTN(p, { ...s, installments: 1 }),
    ...verifiedTNPlans.map((n) => recommendedTN(p, { ...s, installments: n })),
  ].filter((v): v is number => v !== null);
  const suggestedMLOptions = [
    recommendedML(p, { ...s, installments: 1 }),
    ...visibleInstallments.filter((n) => (n === 2 ? s.mlFinancing2 : s.mlFinancing3) !== null)
      .map((n) => recommendedML(p, { ...s, installments: n })),
  ].filter((v): v is number => v !== null);
  const transfer = tnQuote(p.tiendaNubeList, p.cost, "transferencia", s);
  const pn1 = tnQuote(p.tiendaNubeList, p.cost, "pagoNube", s);
  const ml1 = mlQuote(p, s, 1);
  const suggestedTn = suggestedTNOptions.length ? Math.max(...suggestedTNOptions) : null;
  const suggestedMl = suggestedMLOptions.length ? Math.max(...suggestedMLOptions) : null;
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
      <Text strong>Simular cuotas sin interés en esta card</Text>
      <Space wrap size="middle">
        <Checkbox checked={visibleInstallments.includes(2)} onChange={(e) => toggleInstallments(2, e.target.checked)}>
          2 cuotas desde $25.000
        </Checkbox>
        <Checkbox checked={visibleInstallments.includes(3)} onChange={(e) => toggleInstallments(3, e.target.checked)}>
          3 cuotas desde $32.000
        </Checkbox>
      </Space>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Calculamos la comisión y financiación con IVA por medio de pago, el aumento del costo y la diferencia de ganancia. Tildar una opción no activa cuotas en tu tienda.
      </Text>
    </div>
    <div className={styles.recommendations}>
      <div>
        <Text type="secondary">Lista sugerida · Tiendanube</Text>
        <strong>{suggestedTn === null ? "No calculable" : MONEY.format(suggestedTn)}</strong>
        <small>Objetivo protegido en los medios con tasas configuradas{recommendedTransfer ? ", incluida transferencia a " + MONEY.format(recommendedTransfer.productPrice) : ""}. Si falta alguna tasa de cuotas, no está contemplada.</small>
      </div>
      <div>
        <Text type="secondary">Lista sugerida · Mercado Libre</Text>
        <strong>{suggestedMl === null ? "Tasa pendiente" : MONEY.format(suggestedMl)}</strong>
        <small>Según comisión, cargo fijo, logística y cuotas configuradas.</small>
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
    {visibleInstallments.map((n) => <Card key={"tn" + n} size="small" style={{ marginTop: 12, borderColor: "#e3d3ef" }} title={n + " cuotas sin interés · Tiendanube"}>
      <Text type="secondary" style={{ display: "block", marginBottom: 10, fontSize: 12 }}>
        Mínimo {MONEY.format(minimumInstallmentAmount(n))} en productos, luego del descuento promocional.
      </Text>
      <div className={styles.paymentGrid}>
        {PAYMENTS.map((provider) => {
          const rate = financingRate(provider.key, n, s);
          const quote = tnQuote(p.tiendaNubeList, p.cost, provider.key, s, n);
          const one = tnQuote(p.tiendaNubeList, p.cost, provider.key, s, 1);
          return <div className={styles.paymentBox} key={provider.key + n}>
            <Text strong>{provider.label}</Text>
            <div style={{ margin: "6px 0", fontSize: 12 }}>Financiación: <strong>{financingExplanation(rate)}</strong></div>
            <QuoteDetails quote={quote} target={p.targetProfit} />
            <ExtraFinancingCost installment={quote} one={one} profitTarget={p.targetProfit} />
          </div>;
        })}
      </div>
    </Card>)}
    <Divider>Mercado Libre</Divider>
    <div className={styles.paymentBox}>
      <Text strong>Venta en 1 pago</Text>
      <QuoteDetails quote={ml1} target={p.targetProfit} showShipping={false} channel="mercadoLibre" />
      <Text type="secondary">Logística a cargo de SAEL: {MONEY.format(ml1?.shippingExpense ?? 0)}</Text>
    </div>
    {visibleInstallments.map((n) => {
      const quote = mlQuote(p, s, n);
      const rate = n === 2 ? s.mlFinancing2 : s.mlFinancing3;
      return <div className={styles.paymentBox} key={"ml" + n} style={{ marginTop: 12 }}>
        <Text strong>Mercado Libre · {n} cuotas sin interés</Text>
        <div style={{ marginTop: 6, fontSize: 12 }}>Financiación: <strong>{financingExplanation(rate, true)}</strong></div>
        <QuoteDetails quote={quote} target={p.targetProfit} showShipping={false} channel="mercadoLibre" />
        <ExtraFinancingCost one={ml1} installment={quote} profitTarget={p.targetProfit} />
      </div>;
    })}
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

function SettingsPanel({ settings, onChange }: Readonly<{
  settings: Settings; onChange: (patch: Partial<Settings>) => void;
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
    </>,
  }]} />;
}

export function PricingCalculator() {
  const [products, setProducts] = useState<Product[]>(() => PRODUCTS.map((p) => ({ ...p })));
  const [settings, setSettings] = useState<Settings>({ ...SAEL_DEFAULT_SETTINGS });
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
      <Button onClick={() => { setProducts(PRODUCTS.map((p) => ({ ...p }))); setSettings({ ...SAEL_DEFAULT_SETTINGS }); }}>Restablecer valores SAEL</Button>
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
        <Text type="secondary">1 pago siempre visible. Activá 2 o 3 cuotas desde las casillas de cada producto.</Text>
        <Statistic title="Envío gratis desde" value={settings.freeShippingFrom} precision={0} prefix="$" groupSeparator="." />
        <Statistic title="Prendas del carrito" value={selectedProduct} />
      </Space>
      <Alert showIcon type="info" className={styles.tips}
        message="Los precios sugeridos son estimativos, no actualizan publicaciones."
        description="Se contempla el 20% extra de transferencia, la promoción seleccionada, IVA en las comisiones y envío gratis desde $90.000. El precio sugerido se calcula para alcanzar tu ganancia objetivo en las pasarelas con tasas configuradas." />
    </Card>
    <SettingsPanel settings={settings} onChange={changeSettings} />
    <div className={styles.productGrid}>
      {products.map((p) => <PriceProduct key={p.id} p={p} s={settings} onChange={(patch) => changeProduct(p.id, patch)} />)}
    </div>
    <Cart products={products} settings={settings} />
    <Card size="small">
      <Text type="secondary">Los costos precargados ($7.100, $12.000, $21.000, $17.000, $20.000) ya incluyen DTF, luz, packaging habitual e IIBB estimado. No se descuentan de nuevo. SAEL ofrece envío gratis desde $90.000 después de descuentos y suma una friselina adicional de $1.300 por pedido con envío gratis. Mercado Libre puede aplicar otros cargos según logística, categoría o financiación; usá el simulador de tu publicación para ajustarlos. Esta herramienta no reemplaza la liquidación real ni calcula los gastos fijos mensuales.</Text>
    </Card>
  </div>;
}
