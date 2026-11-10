"use client";

import { useMemo, useState } from "react";
import {
  Alert, Button, Card, Col, Collapse, Divider, Input, InputNumber, Radio, Row,
  Select, Space, Statistic, Table, Tag, Typography,
} from "antd";

import {
  MONEY, PAYMENTS, PRODUCTS, SETTINGS, financingRate, minimumInstallmentAmount,
  mlQuote, recommendedML, recommendedTN, tnQuote,
  type Installments, type Product, type Provider, type Quote, type Settings,
} from "../domain/pricing-calculator";
import styles from "./pricing-calculator.module.css";

const { Text, Title, Paragraph } = Typography;

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

function QuoteDetails({ quote, target, n = 1, showShipping = true }: Readonly<{
  quote: Quote | null; target: number; n?: number; showShipping?: boolean;
}>) {
  if (!quote) return <Text type="secondary">No disponible: monto mínimo o tasa de financiación sin configurar.</Text>;
  return <div className={styles.quote}>
    <div className={styles.quoteTop}>
      <span><Text type="secondary">Cliente paga</Text><strong>{MONEY.format(quote.totalCustomer)}</strong></span>
      <span><Text type="secondary">Ganancia SAEL</Text><Gain value={quote.profit} target={target} n={n} /></span>
    </div>
    <div className={styles.meta}>
      <span>Producto(s): {MONEY.format(quote.productPrice)}</span>
      <span>Descuento total de comisión: {quote.rate.toFixed(2).replace(".", ",")}%</span>
      <span>Comisión + financiación: {MONEY.format(quote.processingFee + quote.financeFee + quote.platformFee)}</span>
      {quote.fixedFee > 0 ? <span>Cargo fijo: {MONEY.format(quote.fixedFee)}</span> : null}
      {showShipping ? <span>{quote.freeShipping ? "Envío gratis para el comprador" : "Envío cobrado al comprador: " + MONEY.format(quote.shippingCharged)}</span> : null}
      {quote.bagExpense > 0 ? <span>Friselina extra: {MONEY.format(quote.bagExpense)}</span> : null}
    </div>
    {quote.installments > 1 ? <Text type="secondary">{quote.installments} pagos de {MONEY.format(quote.totalCustomer / quote.installments)}</Text> : null}
  </div>;
}

function PriceProduct({ p, s, onChange }: Readonly<{
  p: Product; s: Settings; onChange: (patch: Partial<Product>) => void;
}>) {
  const transfer = tnQuote(p.tiendaNubeList, p.cost, "transferencia", s);
  const pn1 = tnQuote(p.tiendaNubeList, p.cost, "pagoNube", s);
  const ml = mlQuote(p, s, s.installments);
  const ml1 = mlQuote(p, s, 1);
  const suggestedTn = recommendedTN(p, s);
  const suggestedMl = recommendedML(p, s);
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
    <div className={styles.recommendations}>
      <div>
        <Text type="secondary">Lista sugerida · Tiendanube</Text>
        <strong>{suggestedTn === null ? "No calculable" : MONEY.format(suggestedTn)}</strong>
        <small>Protege el objetivo en los medios con tasas configuradas{recommendedTransfer ? ", incluida transferencia a " + MONEY.format(recommendedTransfer.productPrice) : ""}.</small>
      </div>
      <div>
        <Text type="secondary">Lista sugerida · Mercado Libre</Text>
        <strong>{suggestedMl === null ? "Tasa pendiente" : MONEY.format(suggestedMl)}</strong>
        <small>Según comisión, cargo fijo, logística y cuotas configuradas.</small>
      </div>
    </div>
    <Divider orientation="left">Tiendanube</Divider>
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
        label: "Comparar Pago Nube, Mercado Pago y NAVE" + (s.installments > 1 ? " · " + s.installments + " cuotas" : ""),
        children: <div className={styles.paymentGrid}>
          {PAYMENTS.map((provider) => <div className={styles.paymentBox} key={provider.key}>
            <Text strong>{provider.label} · {s.installments} {s.installments === 1 ? "pago" : "cuotas"}</Text>
            <QuoteDetails quote={tnQuote(p.tiendaNubeList, p.cost, provider.key, s, s.installments)} target={p.targetProfit} />
          </div>)}
        </div>,
      }]}
    />
    <Divider orientation="left">Mercado Libre</Divider>
    <Row gutter={[12, 12]}>
      <Col xs={24} md={12}>
        <div className={styles.paymentBox}>
          <Text strong>Venta en 1 pago</Text>
          <QuoteDetails quote={ml1} target={p.targetProfit} showShipping={false} />
          <Text type="secondary">Logística SAEL: {MONEY.format(ml1?.shippingExpense ?? 0)}</Text>
        </div>
      </Col>
      <Col xs={24} md={12}>
        <div className={styles.paymentBox}>
          <Text strong>Venta en {s.installments} {s.installments === 1 ? "pago" : "cuotas"}</Text>
          <QuoteDetails quote={ml} target={p.targetProfit} showShipping={false} />
          <Text type="secondary">Logística SAEL: {MONEY.format(ml?.shippingExpense ?? 0)}</Text>
        </div>
      </Col>
    </Row>
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
        Las tasas precargadas de financiación son referencias de SAEL, NO están verificadas para tu contrato. Modificalas según los paneles de cada proveedor.
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
          ["pagoNubeFinancing3", "Pago Nube 3 cuotas (referencia)"],
          ["mercadoPagoFinancing2", "Mercado Pago 2 cuotas"],
          ["mercadoPagoFinancing3", "Mercado Pago 3 cuotas (referencia)"],
          ["naveFinancing2", "NAVE 2 cuotas"],
          ["naveFinancing3", "NAVE 3 cuotas (referencia)"],
          ["mlFinancing2", "Mercado Libre 2 cuotas"],
          ["mlFinancing3", "Mercado Libre 3 cuotas (referencia)"],
        ] as const).map(([key, label]) => <RateInput key={key} label={label} value={settings[key]} onChange={(rate) => onChange({ [key]: rate })} />)}
      </div>
    </>,
  }]} />;
}

export function PricingCalculator() {
  const [products, setProducts] = useState<Product[]>(() => PRODUCTS.map((p) => ({ ...p })));
  const [settings, setSettings] = useState<Settings>({ ...SETTINGS });
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
      <Button onClick={() => { setProducts(PRODUCTS.map((p) => ({ ...p }))); setSettings({ ...SETTINGS }); }}>Restablecer valores SAEL</Button>
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
        <div><Text strong>Tarjeta</Text><div className={styles.control}>
          <Select
            style={{ width: 190 }}
            value={settings.installments}
            options={[{ value: 1, label: "1 pago" }, { value: 2, label: "2 cuotas · desde $25.000" }, { value: 3, label: "3 cuotas · desde $32.000" }]}
            onChange={(installments: Installments) => changeSettings({ installments })}
          />
        </div></div>
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
      <Text type="secondary">Los costos precargados ($7.100, $12.000, $21.000, $17.000, $20.000) ya incluyen DTF, luz, packaging habitual e IIBB estimado. No se descuentan de nuevo. La friselina extra solo se suma al envío gratis. Mercado Libre puede aplicar otros cargos según logística, categoría o financiación; usá el simulador de tu publicación para ajustarlos. Esta herramienta no reemplaza la liquidación real ni calcula los gastos fijos mensuales.</Text>
    </Card>
  </div>;
}
