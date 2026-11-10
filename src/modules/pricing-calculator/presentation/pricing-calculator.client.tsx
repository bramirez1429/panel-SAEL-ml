"use client";

import { useMemo, useState } from "react";
import {
  Alert, Button, Card, Checkbox, Col, Collapse, Divider, InputNumber,
  Radio, Row, Select, Space, Tag, Typography,
} from "antd";
import { MONEY, PRODUCTS } from "../domain/pricing-calculator";
import styles from "./pricing-calculator.module.css";

const { Title, Text, Paragraph, Link } = Typography;
type Product = (typeof PRODUCTS)[number];
type Channel = "pagoNube" | "mercadoPago" | "nave" | "transferencia" | "mercadoLibre";
type Term = 1 | 2 | 3 | 6;
type TermRate = 2 | 3 | 6;
type Rates = Record<Exclude<Channel, "transferencia">, Record<TermRate, number | null>>;
type Payouts = { pagoNube: string; mercadoPago: string; nave: string };
type Rates1 = Record<string, number>;
type State = {
  discount: 10 | 15 | 20;
  installments: Term;
  shipping: number;
  freeThreshold: number;
  bag: number;
  forceFreeShipping: boolean;
  forceFreeML: boolean;
  transferDiscount: number;
  mlCommission: number;
  mlFreeFrom: number;
  min2: number;
  min3: number;
  min6: number;
};

type Quote = {
  provider: Channel;
  price: number;
  productPrice: number;
  originalPrice: number;
  shipCharged: number;
  totalCustomer: number;
  rateBase: number;
  ivaOnBase: number;
  rateWithIva: number;
  platformRate: number;
  financeBeforeIva: number | null;
  financeWithIva: number | null;
  fee: number;
  platformFee: number;
  financeFee: number;
  fixedFee: number;
  logistics: number;
  bag: number;
  cost: number;
  profit: number | null;
  freeShipping: boolean;
  eligible: boolean;
  reason: string | null;
};

const money = (n: number): string => MONEY.format(Math.round(n));
const percent = (n: number): string => n.toLocaleString("es-AR", {minimumFractionDigits: 2,maximumFractionDigits: 2}) + "%";
const clean = (v: number | null): number => Math.max(0, Number.isFinite(v ?? 0) ? (v ?? 0) : 0);
const IVA = 1.21;

const DEFAULT_PRODUCTS: Product[] = PRODUCTS.map((p) => ({...p}));
const FIRST: State = {
  discount: 10,
  installments: 1,
  shipping: 11000,
  freeThreshold: 90000,
  bag: 1300,
  forceFreeShipping: false,
  forceFreeML: false,
  transferDiscount: 20,
  mlCommission: 15.5,
  mlFreeFrom: 33000,
  min2: 30000,
  min3: 32000,
  min6: 180000,
};
const FIRST_PAYOUTS: Payouts = {pagoNube: "7", mercadoPago: "10", nave: "now"};
// Tarifas de la cuenta de SAEL, noviembre 2026. Son adicionales a la comisión de cobro.
// Mercado Pago 2/3 = captura del simulador; 6 = Link de Pago, NO confirmado para Checkout.
const FIRST_FINANCING: Rates = {
  pagoNube: {2: 4.4, 3: 10.2, 6: 14},
  mercadoPago: {2: 7.79, 3: 10.49, 6: null},
  nave: {2: null, 3: 5.76, 6: null},
  mercadoLibre: {2: null, 3: null, 6: null},
};
const PAYOUT_OPTIONS = {
  pagoNube: [{value:"1",label:"1 día · 6,09% + IVA"},{value:"7",label:"7 días · 4,39% + IVA"},{value:"14",label:"14 días · 3,49% + IVA"},{value:"30",label:"30 días · 2,97% + IVA"}],
  mercadoPago: [{value:"now",label:"Inmediato · 6,29% + IVA"},{value:"10",label:"10 días · 4,39% + IVA"},{value:"18",label:"18 días · 3,39% + IVA"},{value:"35",label:"35 días · 1,49% + IVA"}],
  nave: [{value:"now",label:"Inmediato · 5,80% + IVA"},{value:"other",label:"Otros plazos · 1,80% + IVA"}],
};
const BASE_RATES: Record<"pagoNube" | "mercadoPago" | "nave", Rates1> = {
  pagoNube: {"1":6.09,"7":4.39,"14":3.49,"30":2.97},
  mercadoPago: {"now":6.29,"10":4.39,"18":3.39,"35":1.49},
  nave: {"now":5.8,"other":1.8},
};
const PROVIDERS: Array<{key: "pagoNube" | "mercadoPago" | "nave";name:string}> = [
  {key:"pagoNube",name:"Pago Nube"},
  {key:"mercadoPago",name:"Mercado Pago"},
  {key:"nave",name:"NAVE"},
];
const NAMES: Record<Channel, string> = {
  pagoNube:"Pago Nube",mercadoPago:"Mercado Pago",nave:"NAVE",transferencia:"Transferencia Pago Nube",mercadoLibre:"Mercado Libre",
};
// CFT publicado por Banco Galicia para cobros con tarjeta de crédito vía NAVE.
// Fuente: https://www.galicia.ar/empresas/tarjetas-y-cuentas/cuenta-comercio/nave
// Informativo: NO es un recargo adicional que deba sumarse a la comisión + cuota.
const NAVE_CFT = [
  { cuotas: 1, cft: 0 },
  { cuotas: 3, cft: 7.64 },
  { cuotas: 6, cft: 13.89 },
  { cuotas: 9, cft: 29.76 },
  { cuotas: 12, cft: 40.24 },
] as const;
const NAVE_CFT_CURRENT: Partial<Record<Term, number>> = {1: 0, 3: 7.64, 6: 13.89};
const RATE_MISSING = "No hay tasa de financiación confirmada para este medio. Cargala en Ajustes; el simulador no inventa esa ganancia.";

function threshold(s: State): number {
  return s.installments === 2 ? s.min2 : s.installments === 3 ? s.min3 : s.installments === 6 ? s.min6 : 0;
}

function quote(p: Product, channel: Channel, list: number, s: State, payouts: Payouts, rates: Rates): Quote {
  const price = Math.round(clean(list) * (1 - s.discount/100));
  const trans = channel === "transferencia";
  const ml = channel === "mercadoLibre";
  const productPrice = Math.round(price * (trans ? (1 - s.transferDiscount/100) : 1));
  const freeShipping = ml ? (s.forceFreeML || productPrice >= s.mlFreeFrom) : (s.forceFreeShipping || productPrice >= s.freeThreshold);
  const shipCharged = ml || freeShipping ? 0 : s.shipping;
  const totalCustomer = productPrice + shipCharged;
  const logistics = ml ? (freeShipping ? p.mlShipping : 0) : s.shipping;
  const bag = !ml && freeShipping ? s.bag : 0;
  const fixedFee = ml && productPrice < s.mlFreeFrom ? p.mlFixedFee : 0;
  const rateBase = ml ? s.mlCommission : trans ? 1.5 : (BASE_RATES[channel][payouts[channel]] ?? 0);
  const rateWithIva = ml ? rateBase : rateBase * IVA;
  const ivaOnBase = ml ? 0 : rateWithIva-rateBase;
  const platformRate = ml || trans || channel === "pagoNube" ? 0 : 2;
  const n: Term = trans ? 1 : s.installments;
  const min = trans || ml ? 0 : threshold(s);
  const eligible = productPrice >= min;
  const financeBeforeIva = n === 1 ? 0 : rates[channel as Exclude<Channel,"transferencia">][n];
  const financeWithIva = financeBeforeIva === null ? null : ml ? financeBeforeIva : financeBeforeIva * IVA;
  const base = ml ? productPrice : totalCustomer;
  const fee = base * rateWithIva/100;
  const platformFee = base * platformRate/100;
  const financeFee = financeWithIva === null ? 0 : base * financeWithIva/100;
  const cost = p.cost;
  const reason = !eligible ? "El producto no alcanza el mínimo configurado para estas cuotas." : financeWithIva === null ? RATE_MISSING : null;
  const profit = reason ? null : totalCustomer - fee - platformFee - financeFee - fixedFee - logistics - bag - cost;
  return {provider:channel,price:clean(list),productPrice,originalPrice:clean(list),shipCharged,totalCustomer,rateBase,ivaOnBase,rateWithIva,platformRate,
    financeBeforeIva,financeWithIva,fee,platformFee,financeFee,fixedFee,logistics,bag,cost,profit,freeShipping,eligible,reason};
}

function solve(
  p: Product, channels: Channel[], s: State, payouts: Payouts, rates: Rates,
  channelType: "tn" | "ml",
): number | null {
  const known = channels.filter((ch) => !(s.installments !== 1 && ch !== "transferencia" && rates[ch as Exclude<Channel,"transferencia">][s.installments as TermRate] === null));
  if (known.length === 0) return null;
  for (let list = Math.max(1000,Math.ceil(p.cost/100)*100); list <= 500000; list+=100) {
    let ok = true;
    for (const ch of known) {
      const q = quote(p,ch,list,s,payouts,rates);
      if (q.profit === null || q.profit < p.targetProfit) {ok=false;break;}
    }
    if (ok) return list;
  }
  return null;
}

function MoneyInput({label,value,onChange,description}:Readonly<{label:string;value:number;onChange:(v:number)=>void;description?:string}>) {
  return <label style={{display:"grid",gap:5,width:"100%",fontSize:12,fontWeight:650,color:"#45415c"}}>
    {label}
    <InputNumber
      style={{width:"100%"}}
      min={0}
      max={20000000}
      controls={false}
      value={value}
      addonBefore="$"
      onChange={(value) => onChange(clean(value))}
    />
    {description ? <Text type="secondary" style={{fontSize:11,fontWeight:400}}>{description}</Text> : null}
  </label>;
}
function RateInput({label,value,onChange,ml = false}:Readonly<{label:string;value:number|null;onChange:(v:number|null)=>void;ml?:boolean}>) {
  return <label style={{display:"grid",gap:5,fontSize:12,fontWeight:600}}>
    {label}
    <InputNumber style={{width:"100%"}} min={0} max={100} step={0.1} controls={false} value={value}
      placeholder="Por confirmar" addonAfter="%" onChange={(v)=>onChange(v)} />
    <Text type="secondary" style={{fontSize:11}}>{ml?"Tasa total adicional según tu publicación":"Porcentaje antes de IVA (se suma 21%)"}</Text>
  </label>;
}

function TrafficLight({q,target}:{q:Quote,target:number}) {
  if(q.reason) return <Tag color="warning">Pendiente</Tag>;
  if((q.profit ?? 0) < 0) return <Tag color="error">Pérdida</Tag>;
  if((q.profit ?? 0) < target) return <Tag color="warning">Ganancia insuficiente</Tag>;
  return <Tag color="success">Cumple tu objetivo</Tag>;
}


function AmountRow({label,value,strong = false}: Readonly<{label:string;value:string;strong?:boolean}>) {
  return <div className={styles.amountRow}>
    <span className={strong ? styles.rowEmphasis : ""}>{label}</span>
    <strong className={strong ? styles.rowEmphasis : ""}>{value}</strong>
  </div>;
}

function ProfitAmount({q,target,compact=false}:Readonly<{q:Quote;target:number;compact?:boolean}>) {
  return <div className={styles.profitBlock}>
    <strong className={q.profit===null?styles.pending:q.profit>=target?styles.positive:styles.negative}
      style={{fontSize:compact?20:24}}>
      {q.profit===null?"Pendiente":money(q.profit)}
    </strong>
    <TrafficLight q={q} target={target}/>
  </div>;
}

function Breakdown({q,channel}:Readonly<{q:Quote;channel:"tn"|"ml"}>) {
  return <div className={styles.detailsList}>
    <AmountRow label="Costo de la prenda (incluye packaging, luz e IIBB)" value={money(q.cost)}/>
    <AmountRow label={channel==="ml"?"Comisión de Mercado Libre":"Comisión del medio de cobro"}
      value={money(q.fee)+" · "+percent(q.rateWithIva)}/>
    {channel==="tn" && q.platformRate>0 ? <AmountRow label="Comisión extra Tiendanube" value={money(q.platformFee)+" · "+percent(q.platformRate)}/> : null}
    {q.financeWithIva!==null?
      <AmountRow label="Financiación adicional" value={money(q.financeFee)+" · "+percent(q.financeWithIva)}/> :
      <div className={styles.warningSmall}>Falta confirmar el costo de financiar estas cuotas.</div>}
    {channel==="ml"?<>
      <AmountRow label="Cargo fijo estimado" value={money(q.fixedFee)}/>
      <AmountRow label="Costo de logística" value={money(q.logistics)}/>
    </>:<>
      <AmountRow label="Envío cobrado al cliente" value={money(q.shipCharged)}/>
      <AmountRow label="Costo del envío para SAEL" value={money(q.logistics)}/>
      <AmountRow label="Friselina extra" value={money(q.bag)}/>
    </>}
    <Divider style={{margin:"5px 0"}}/>
    <AmountRow label="Total pagado por el cliente" value={money(q.totalCustomer)} strong/>
    <AmountRow label="Ganancia estimada SAEL" value={q.profit===null?"Pendiente":money(q.profit)} strong/>
    {q.reason?<Text type="warning" style={{fontSize:12}}>{q.reason}</Text>:null}
  </div>;
}

const METHOD_NAMES: Record<"pagoNube"|"mercadoPago"|"nave",string> = {
  pagoNube:"Pago Nube", mercadoPago:"Mercado Pago", nave:"NAVE",
};

export function PricingCalculator() {
  const [products,setProducts] = useState<Product[]>(()=>DEFAULT_PRODUCTS.map(item=>({...item})));
  const [active,setActive] = useState(DEFAULT_PRODUCTS[0]!.id);
  const [s,setS] = useState<State>({...FIRST});
  const [payouts,setPayouts] = useState<Payouts>({...FIRST_PAYOUTS});
  const [financing,setFinancing] = useState<Rates>(()=>({
    pagoNube:{...FIRST_FINANCING.pagoNube},
    mercadoPago:{...FIRST_FINANCING.mercadoPago},
    nave:{...FIRST_FINANCING.nave},
    mercadoLibre:{...FIRST_FINANCING.mercadoLibre},
  }));

  const p = products.find(item=>item.id===active) ?? products[0]!;
  const updateProduct = (changes:Partial<Product>)=>
    setProducts(current=>current.map(item=>item.id===active?{...item,...changes}:item));
  const updateState = (changes:Partial<State>)=>setS(current=>({...current,...changes}));
  const updateRate = (provider:Exclude<Channel,"transferencia">,count:TermRate,value:number|null)=>
    setFinancing(current=>({...current,[provider]:{...current[provider],[count]:value}}));

  const quotes = useMemo(()=>({
    pagoNube:quote(p,"pagoNube",p.tiendaNubeList,s,payouts,financing),
    mercadoPago:quote(p,"mercadoPago",p.tiendaNubeList,s,payouts,financing),
    nave:quote(p,"nave",p.tiendaNubeList,s,payouts,financing),
    transferencia:quote(p,"transferencia",p.tiendaNubeList,s,payouts,financing),
    mercadoLibre:quote(p,"mercadoLibre",p.mercadoLibreList,s,payouts,financing),
  }),[p,s,payouts,financing]);

  const channels:Channel[]=["pagoNube","mercadoPago","nave","transferencia"];
  const suggestedTN = useMemo(()=>solve(p,channels,s,payouts,financing,"tn"),[p,s,payouts,financing]);
  const suggestedML = useMemo(()=>solve(p,["mercadoLibre"],s,payouts,financing,"ml"),[p,s,payouts,financing]);
  const tnPrice = Math.round(p.tiendaNubeList*(1-s.discount/100));
  const mlPrice = Math.round(p.mercadoLibreList*(1-s.discount/100));
  const chosenMin=threshold(s);
  const missingTN = s.installments>1 && PROVIDERS.some(({key})=>financing[key][s.installments as TermRate]===null);
  const mlIncomplete = quotes.mercadoLibre.profit===null;

  const applySuggested=(channel:"tn"|"ml")=>{
    const recommendation=channel==="tn"?suggestedTN:suggestedML;
    if(recommendation===null)return;
    updateProduct(channel==="tn"?{tiendaNubeList:recommendation}:{mercadoLibreList:recommendation});
  };
  const reset=()=>{
    setProducts(DEFAULT_PRODUCTS.map(item=>({...item})));
    setActive(DEFAULT_PRODUCTS[0]!.id);
    setS({...FIRST});
    setPayouts({...FIRST_PAYOUTS});
    setFinancing({
      pagoNube:{...FIRST_FINANCING.pagoNube},
      mercadoPago:{...FIRST_FINANCING.mercadoPago},
      nave:{...FIRST_FINANCING.nave},
      mercadoLibre:{...FIRST_FINANCING.mercadoLibre},
    });
  };
  return <div className={styles.simpleRoot} data-dashboard-full-width="true">
    <div className={styles.simpleHeader}>
      <div>
        <Title level={2} style={{margin:"0 0 4px"}}>SAEL | Calculadora de precios</Title>
        <Text type="secondary">Calculá fácil cuánto vender, qué gastos tenés y cuánto ganás.</Text>
      </div>
      <Button onClick={reset}>Restablecer</Button>
    </div>

    <div className={styles.simpleLayout}>
      <main className={styles.simpleForm} aria-label="Configurar simulación de venta">
        <Card className={styles.stepCard} title="1 · ¿Qué producto querés vender?">
          <Radio.Group value={active} onChange={e=>setActive(String(e.target.value))}
            className={styles.productChoices}>
            {PRODUCTS.map(item=><Radio key={item.id} value={item.id}>{item.name}</Radio>)}
          </Radio.Group>
          <Text type="secondary" className={styles.hint}>Se muestra un producto por vez. Cada uno conserva sus propios precios y costos durante esta sesión.</Text>
        </Card>

        <Card className={styles.stepCard} title="2 · Costos, precios y promociones">
          <Text type="secondary" className={styles.intro}>
            Completá tus números y elegí cómo vender. Los resultados a la derecha se actualizan automáticamente.
          </Text>
          <div className={styles.setupSquares}>
            <section className={styles.setupSquare} aria-label="Costos y ganancias">
              <div className={styles.setupSquareHeading}>
                <Text strong>Costos y ganancias</Text>
                <Text type="secondary" className={styles.hint}>¿Cuánto te cuesta y cuánto querés ganar?</Text>
              </div>
              <Row gutter={[10,12]}>
                <Col xs={12}><MoneyInput label="Costo de la prenda" value={p.cost} onChange={cost=>updateProduct({cost})}/></Col>
                <Col xs={12}><MoneyInput label="Ganancia deseada" value={p.targetProfit} onChange={targetProfit=>updateProduct({targetProfit})}/></Col>
                <Col xs={24}><MoneyInput label="Precio de lista Tiendanube" value={p.tiendaNubeList} onChange={tiendaNubeList=>updateProduct({tiendaNubeList})} description="Antes del descuento promocional."/></Col>
                <Col xs={24}><MoneyInput label="Precio de lista Mercado Libre" value={p.mercadoLibreList} onChange={mercadoLibreList=>updateProduct({mercadoLibreList})} description="Antes del descuento promocional."/></Col>
              </Row>
              <Text type="secondary" className={styles.hint}>
                Incluye estampado, packaging habitual, luz e IIBB estimado. No se duplican esos costos.
              </Text>
            </section>
            <section className={styles.setupSquare} aria-label="Promociones y cuotas">
              <div className={styles.setupSquareHeading}>
                <Text strong>Promociones y cuotas</Text>
                <Text type="secondary" className={styles.hint}>Elegí una promoción y un plazo de pago.</Text>
              </div>
              <div className={styles.formStack}>
                <label className={styles.label}>Descuento promocional</label>
                <Radio.Group value={s.discount} optionType="button" buttonStyle="solid"
                  onChange={e=>updateState({discount:e.target.value as State["discount"]})}
                  options={[{label:"10% OFF",value:10},{label:"15% OFF",value:15},{label:"20% OFF",value:20}]}
                  className={styles.segmented}
                  style={{display:"flex",flexWrap:"wrap",gap:10}}/>
                <Text type="secondary" className={styles.hint}>10% habitual; 15% y 20% para ocasiones especiales. Transferencia suma otro 20% OFF.</Text>
                <label className={styles.label}>¿En cuántas cuotas sin interés?</label>
                <Radio.Group value={s.installments} optionType="button" buttonStyle="solid"
                  onChange={e=>updateState({installments:e.target.value as Term})}
                  options={[{label:"1 pago",value:1},{label:"2 cuotas",value:2},{label:"3 cuotas",value:3},{label:"6 cuotas",value:6}]}
                  className={styles.segmented}
                  style={{display:"flex",flexWrap:"wrap",gap:10}}/>
                {s.installments>1?
                  <Text className={styles.hint}>Compra mínima para las cuotas elegidas: {money(chosenMin)} de productos después de descuentos.</Text>:
                  <Text type="secondary" className={styles.hint}>1 pago, sin costo adicional de financiación.</Text>}
                <Checkbox checked={s.forceFreeShipping} onChange={e=>updateState({forceFreeShipping:e.target.checked})}>
                  Ofrecer envío gratis adicional en Tiendanube
                </Checkbox>
                <Text type="secondary" className={styles.hint}>
                  Envío gratis automático desde {money(s.freeThreshold)} de productos después de descuentos.
                  Bolsa de friselina {money(s.bag)} por pedido con envío gratis.
                </Text>
              </div>
            </section>
          </div>
        </Card>

        <Card className={styles.stepCard} title="3 · ¿Cuándo recibís el dinero y cuánto ganás en Tiendanube?">
          <Text type="secondary" className={styles.intro}>
            Elegí el plazo de acreditación de cada medio: el precio de venta, los cargos y tu ganancia se actualizan automáticamente.
          </Text>
          <div className={styles.combinedProviderList}>
            {PROVIDERS.map(({key,name})=>{
              const q=quotes[key];
              const totalRate=q.financeWithIva===null?null:q.rateWithIva+q.platformRate+q.financeWithIva;
              return <div key={key} className={styles.combinedProviderRow}>
                <div className={styles.combinedProviderName}>
                  <Text strong>{name}</Text>
                  <Text type="secondary" className={styles.hint}>
                    {key==="pagoNube"?"Sin comisión extra TN":"+ 2% Tiendanube"}
                  </Text>
                </div>
                <div className={styles.combinedProviderPayout}>
                  <label className={styles.combinedCaption} htmlFor={"plazo-"+key}>Recibís en</label>
                  <Select
                    id={"plazo-"+key}
                    aria-label={"Acreditación "+name}
                    value={payouts[key]}
                    options={PAYOUT_OPTIONS[key]}
                    onChange={value=>setPayouts(old=>({...old,[key]:value}))}
                    style={{width:"100%"}}
                  />
                </div>
                <div className={styles.combinedMetric}>
                  <Text className={styles.combinedCaption}>Precio</Text>
                  <strong>{money(q.productPrice)}</strong>
                </div>
                <div className={styles.combinedMetric}>
                  <Text className={styles.combinedCaption}>Cargos totales</Text>
                  <strong>{totalRate===null?"Pendiente":percent(totalRate)}</strong>
                  <Text type="secondary" className={styles.hint}>
                    {q.profit===null?"Sin cálculo":money(q.fee+q.platformFee+q.financeFee)}
                  </Text>
                </div>
                <div className={styles.combinedProviderProfit}>
                  <Text className={styles.combinedCaption}>Ganancia SAEL</Text>
                  <ProfitAmount q={q} target={p.targetProfit} compact/>
                </div>
              </div>;
            })}
          </div>
          <div className={styles.transferHighlight}>
            <div className={styles.transferHeading}>
              <Text strong style={{color:"#087c50"}}>Transferencia bancaria</Text>
              <Tag color="green">20% EXTRA OFF</Tag>
            </div>
            <AmountRow label="Precio del producto" value={money(quotes.transferencia.productPrice)}/>
            <div className={styles.transferProfitLine}>
              <Text strong>Ganancia estimada SAEL</Text>
              <ProfitAmount q={quotes.transferencia} target={p.targetProfit} compact/>
            </div>
            <Text type="secondary" className={styles.hint}>
              Comisión 1,50% + IVA = 1,815%. El envío gratis se determina después del descuento por transferencia.
            </Text>
          </div>
          <Collapse className={styles.softDisclosure} size="small" items={[{
            key:"tnDetails",
            label:<span className={styles.softDisclosureLabel}>Ver desglose de comisiones y gastos</span>,
            children:<div className={styles.breakdownCards}>
              {PROVIDERS.map(({key,name})=><div key={key}>
                <Text strong>{name}</Text>
                <Breakdown q={quotes[key]} channel="tn"/>
              </div>)}
              <div>
                <Text strong style={{color:"#087c50"}}>Transferencia</Text>
                <Breakdown q={quotes.transferencia} channel="tn"/>
              </div>
            </div>,
          }]}/>
          <Text type="secondary" className={styles.hint}>
            La ganancia incluye costo de la prenda, comisiones, financiación, envío y friselina cuando corresponde.
            Las tasas no confirmadas se muestran pendientes.
          </Text>
        </Card>

        <Card className={styles.stepCard} title="4 · ¿Cuánto ganás realmente en Mercado Libre?">
          <div className={styles.mlOverview}>
            <div>
              <Text type="secondary" className={styles.hint}>Precio final del producto</Text>
              <Title level={3} style={{margin:"5px 0 0"}}>{money(mlPrice)}</Title>
              <Text delete type="secondary">{money(p.mercadoLibreList)}</Text>
            </div>
            <div>
              <Text type="secondary" className={styles.hint}>Ganancia estimada SAEL</Text>
              <ProfitAmount q={quotes.mercadoLibre} target={p.targetProfit}/>
            </div>
          </div>
          <Collapse className={styles.cleanCollapse} size="small" items={[{
            key:"mlDetails",label:"Ver desglose y ajustar cargos de Mercado Libre",
            children:<div className={styles.formStack}>
              <Breakdown q={quotes.mercadoLibre} channel="ml"/>
              <Divider style={{margin:"5px 0"}}/>
              <Text strong>Costos de tu publicación</Text>
              <Row gutter={[12,12]}>
                <Col xs={24} sm={8}><RateInput label="Comisión ML (%)" value={s.mlCommission} ml onChange={v=>updateState({mlCommission:clean(v)})}/></Col>
                <Col xs={24} sm={8}><MoneyInput label="Cargo fijo estimado" value={p.mlFixedFee} onChange={mlFixedFee=>updateProduct({mlFixedFee})}/></Col>
                <Col xs={24} sm={8}><MoneyInput label="Envío pagado por SAEL" value={p.mlShipping} onChange={mlShipping=>updateProduct({mlShipping})}/></Col>
              </Row>
              <Checkbox checked={s.forceFreeML} onChange={e=>updateState({forceFreeML:e.target.checked})}>
                Simular envío gratis ML adicional
              </Checkbox>
              <Text type="secondary" className={styles.hint}>Mercado Libre calcula la comisión, los cargos fijos, el envío y la financiación según la publicación. Estos valores son configurables y no son una cotización en tiempo real.</Text>
            </div>,
          }]}/>
        </Card>

        <Collapse className={styles.cleanCollapse} size="small" items={[{
          key:"advanced",
          label:"Configuración avanzada · financiación, envíos y mínimos",
          children:<div className={styles.formStack}>
            <Text type="secondary" className={styles.hint}>Si no hay una tasa confirmada de cuotas, se muestra “Pendiente” y no se inventa una ganancia. El porcentaje se suma a la comisión de cobro.</Text>
            <Row gutter={[12,12]}>
              <Col xs={24} sm={12}><MoneyInput label="Envío Tiendanube ($)" value={s.shipping} onChange={shipping=>updateState({shipping})}/></Col>
              <Col xs={24} sm={12}><MoneyInput label="Envío gratis desde ($)" value={s.freeThreshold} onChange={freeThreshold=>updateState({freeThreshold})}/></Col>
              <Col xs={24} sm={12}><MoneyInput label="Friselina extra ($)" value={s.bag} onChange={bag=>updateState({bag})}/></Col>
              <Col xs={24} sm={12}><MoneyInput label="Umbral logístico ML ($)" value={s.mlFreeFrom} onChange={mlFreeFrom=>updateState({mlFreeFrom})}/></Col>
              <Col xs={24} sm={8}><MoneyInput label="Mínimo 2 cuotas ($)" value={s.min2} onChange={min2=>updateState({min2})}/></Col>
              <Col xs={24} sm={8}><MoneyInput label="Mínimo 3 cuotas ($)" value={s.min3} onChange={min3=>updateState({min3})}/></Col>
              <Col xs={24} sm={8}><MoneyInput label="Mínimo 6 cuotas ($)" value={s.min6} onChange={min6=>updateState({min6})}/></Col>
            </Row>
            <Divider style={{margin:"4px 0"}}/>
            <Text strong>Tasas de financiación adicionales</Text>
            <Text type="secondary" className={styles.hint}>Tiendanube: porcentajes ANTES de IVA. Mercado Libre: porcentaje final de tu liquidación, sin sumar IVA dos veces.</Text>
            <div className={styles.rateGrid}>
              {(["pagoNube","mercadoPago","nave","mercadoLibre"] as const).map(provider=>
                <div className={styles.rateCard} key={provider}>
                  <Text strong>{NAMES[provider]}</Text>
                  <Row gutter={[8,8]} style={{marginTop:8}}>
                    {([2,3,6] as TermRate[]).map(n=><Col xs={8} key={n}>
                      <RateInput label={n+" cuotas"} value={financing[provider][n]} ml={provider==="mercadoLibre"}
                        onChange={value=>updateRate(provider,n,value)}/>
                    </Col>)}
                  </Row>
                </div>)}
            </div>
            <Text type="secondary" className={styles.hint}>
              CFT informativo NAVE (no se suma a la comisión): {NAVE_CFT.map(item=>item.cuotas+" cuotas "+percent(item.cft)).join(" · ")}.
            </Text>
          </div>
        }]}/>

        <Alert type="info" showIcon
          message="Estos resultados son estimaciones, no modificaciones de publicaciones"
          description="La simulación no cambia precios ni stock en Mercado Libre o Tiendanube. Los gastos fijos mensuales, publicidad y cargos no configurados se calculan aparte."/>
      </main>

      <aside className={styles.simpleSummary} aria-label="Resultados actualizados">
        <Text type="secondary" className={styles.summaryTitle}>TU RESULTADO EN VIVO · {p.name}</Text>

        <Card className={styles.summaryCard} title={<Space><span>Tiendanube</span><Tag color="purple">{s.discount}% OFF</Tag></Space>}>
          <Text type="secondary" className={styles.hint}>Precio de lista recomendado</Text>
          <Title level={2} style={{margin:"3px 0 0"}}>{suggestedTN===null?"Pendiente":money(suggestedTN)}</Title>
          {missingTN?<Text type="warning" className={styles.hint}>Sugerencia parcial: falta confirmar financiación en algún medio.</Text>:null}
          <div className={styles.summaryRows}>
            <AmountRow label="Precio promocional actual" value={money(tnPrice)}/>
            <AmountRow label="Por transferencia · 20% extra" value={money(quotes.transferencia.productPrice)}/>
          </div>
          <Divider style={{margin:"4px 0"}}/>
          <Text type="secondary" className={styles.hint}>Ganancia Pago Nube</Text>
          <ProfitAmount q={quotes.pagoNube} target={p.targetProfit} compact/>
          <div className={styles.transferMini}>
            <Text strong style={{color:"#087c50"}}>Transferencia · 20% OFF extra</Text>
            <AmountRow label="Ganancia SAEL" value={money(quotes.transferencia.profit??0)}/>
          </div>
          <Button type="primary" block disabled={suggestedTN===null||suggestedTN===p.tiendaNubeList}
            onClick={()=>applySuggested("tn")}>Probar precio sugerido</Button>
          <Collapse className={styles.cleanCollapse} size="small" items={[{
            key:"summaryTN",label:"Ver desglose de gastos",
            children:<div className={styles.formStack}>
              <Breakdown q={quotes.pagoNube} channel="tn"/>
              <Divider style={{margin:"2px 0"}}/>
              <Text strong>Otros cobros en Tiendanube</Text>
              <AmountRow label="Mercado Pago · ganancia" value={quotes.mercadoPago.profit===null?"Pendiente":money(quotes.mercadoPago.profit)}/>
              <AmountRow label="NAVE · ganancia" value={quotes.nave.profit===null?"Pendiente":money(quotes.nave.profit)}/>
              <AmountRow label="Transferencia · total cliente" value={money(quotes.transferencia.totalCustomer)}/>
            </div>,
          }]}/>
        </Card>

        <Card className={styles.summaryCard} title={<Space><span>Mercado Libre</span><Tag color="blue">{s.discount}% OFF</Tag></Space>}>
          <Text type="secondary" className={styles.hint}>Precio de lista recomendado</Text>
          <Title level={2} style={{margin:"3px 0 0"}}>{suggestedML===null?"Pendiente":money(suggestedML)}</Title>
          {mlIncomplete?<Text type="warning" className={styles.hint}>Falta una tasa de financiación o no se cumplen los requisitos.</Text>:null}
          <div className={styles.summaryRows}>
            <AmountRow label="Precio promocional actual" value={money(mlPrice)}/>
          </div>
          <Divider style={{margin:"4px 0"}}/>
          <Text type="secondary" className={styles.hint}>Ganancia estimada SAEL</Text>
          <ProfitAmount q={quotes.mercadoLibre} target={p.targetProfit} compact/>
          <Button block disabled={suggestedML===null||suggestedML===p.mercadoLibreList}
            onClick={()=>applySuggested("ml")}>Probar precio sugerido</Button>
          <Collapse className={styles.cleanCollapse} size="small" items={[{
            key:"summaryML",label:"Ver desglose de gastos",
            children:<Breakdown q={quotes.mercadoLibre} channel="ml"/>,
          }]}/>
          <Text type="secondary" className={styles.hint}>Los cargos de Mercado Libre se estiman con los valores de tu publicación; no se consultan en vivo.</Text>
        </Card>
      </aside>
    </div>
  </div>;
}
