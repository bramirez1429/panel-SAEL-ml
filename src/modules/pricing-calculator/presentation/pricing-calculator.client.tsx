"use client";

import { useMemo, useState } from "react";
import {
  Alert, Button, Card, Checkbox, Col, Collapse, Divider, InputNumber,
  Radio, Row, Select, Space, Statistic, Table, Tag, Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
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
  pagoNube: [{value:"7",label:"7 días · 4,39% + IVA"},{value:"14",label:"14 días · 3,49% + IVA"},{value:"30",label:"30 días · 2,97% + IVA"}],
  mercadoPago: [{value:"now",label:"Inmediato · 6,29% + IVA"},{value:"10",label:"10 días · 4,39% + IVA"},{value:"18",label:"18 días · 3,39% + IVA"},{value:"35",label:"35 días · 1,49% + IVA"}],
  nave: [{value:"now",label:"Inmediato · 5,80% + IVA"},{value:"other",label:"Otros plazos · 1,80% + IVA"}],
};
const BASE_RATES: Record<"pagoNube" | "mercadoPago" | "nave", Rates1> = {
  pagoNube: {"7":4.39,"14":3.49,"30":2.97},
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

export function PricingCalculator() {
  const [products,setProducts] = useState<Product[]>(() => DEFAULT_PRODUCTS.map(x=>({...x})));
  const [active,setActive] = useState(DEFAULT_PRODUCTS[0]!.id);
  const [s,setS] = useState<State>({...FIRST});
  const [payouts,setPayouts] = useState<Payouts>({...FIRST_PAYOUTS});
  const [financing,setFinancing] = useState<Rates>(() => ({
    pagoNube:{...FIRST_FINANCING.pagoNube},mercadoPago:{...FIRST_FINANCING.mercadoPago},
    nave:{...FIRST_FINANCING.nave},mercadoLibre:{...FIRST_FINANCING.mercadoLibre},
  }));
  const p = products.find(x=>x.id===active) ?? products[0]!;
  const updateProduct = (patch:Partial<Product>)=>setProducts(old=>old.map(x=>x.id===p.id?{...x,...patch}:x));
  const updateState = (patch:Partial<State>)=>setS(old=>({...old,...patch}));
  const payoutsUpdate = (provider:keyof Payouts,value:string)=>setPayouts(old=>({...old,[provider]:value}));
  const ratesUpdate = (provider:Exclude<Channel,"transferencia">,n:TermRate,v:number|null)=>
    setFinancing(old=>({...old,[provider]:{...old[provider],[n]:v}}));

  const tnProviders: Channel[] = ["pagoNube","mercadoPago","nave","transferencia"];
  const activeQuotes = useMemo(()=>({
    pagoNube:quote(p,"pagoNube",p.tiendaNubeList,s,payouts,financing),
    mercadoPago:quote(p,"mercadoPago",p.tiendaNubeList,s,payouts,financing),
    nave:quote(p,"nave",p.tiendaNubeList,s,payouts,financing),
    transferencia:quote(p,"transferencia",p.tiendaNubeList,s,payouts,financing),
    mercadoLibre:quote(p,"mercadoLibre",p.mercadoLibreList,s,payouts,financing),
  }),[p,s,payouts,financing]);
  const tnSuggested = useMemo(()=>solve(p,tnProviders,s,payouts,financing,"tn"),[p,s,payouts,financing]);
  const mlSuggested = useMemo(()=>solve(p,["mercadoLibre"],s,payouts,financing,"ml"),[p,s,payouts,financing]);
  const afterTN = Math.round(p.tiendaNubeList*(1-s.discount/100));
  const afterML = Math.round(p.mercadoLibreList*(1-s.discount/100));
  const incomplete = s.installments>1 && PROVIDERS.some(x=>financing[x.key][s.installments as TermRate]===null);
  const allValid = [activeQuotes.pagoNube,activeQuotes.mercadoPago,activeQuotes.nave,activeQuotes.transferencia].every(x=>x.profit!==null && x.profit>=p.targetProfit);
  const tnStatus = incomplete ? "pending" : allValid ? "good" : "bad";
  const mlQ = activeQuotes.mercadoLibre;
  const min = threshold(s);
  const productNames = PRODUCTS.map(x=>({label:x.name,id:x.id}));
  const reset = ()=> {
    setProducts(DEFAULT_PRODUCTS.map(x=>({...x})));setActive(DEFAULT_PRODUCTS[0]!.id);setS({...FIRST});
    setPayouts({...FIRST_PAYOUTS});
    setFinancing({
      pagoNube:{...FIRST_FINANCING.pagoNube},mercadoPago:{...FIRST_FINANCING.mercadoPago},
      nave:{...FIRST_FINANCING.nave},mercadoLibre:{...FIRST_FINANCING.mercadoLibre},
    });
  };

  const rows = PROVIDERS.map(({key,name})=>{
    const q=activeQuotes[key];
    const rec = solve(p,[key],s,payouts,financing,"tn");
    return {key,name,q,rec};
  });
  type TnRow = (typeof rows)[number];
  const columns:ColumnsType<TnRow> = [
    {title:"Medio de cobro",dataIndex:"name",key:"name",render:(name:string,record)=><div style={{display:"grid",gap:3}}>
      <strong>{name}</strong>
      <Text type="secondary" style={{fontSize:11}}>{record.q.platformRate>0?"+ 2% Tiendanube":"0% adicional Tiendanube"}</Text>
    </div>},
    {title:"Tasa con IVA",key:"fee",render:(_,row)=><div style={{display:"grid",gap:3}}>
      <strong>{percent(row.q.rateWithIva+row.q.platformRate+(row.q.financeWithIva ?? 0))}</strong>
      <Text type="secondary" style={{fontSize:11}}>
        Cobro {percent(row.q.rateBase)} + IVA {row.q.ivaOnBase>0?percent(row.q.ivaOnBase):"incl."}
        {row.q.platformRate?" · plataforma "+percent(row.q.platformRate):""}
      </Text>
      {s.installments>1?<Text type="secondary" style={{fontSize:11}}>
        Cuotas {row.q.financeBeforeIva===null?"sin tasa":percent(row.q.financeBeforeIva)+" + IVA = "+percent(row.q.financeWithIva ?? 0)}
      </Text>:null}
    </div>},
    {title:"Cargos",key:"costs",render:(_,row)=>row.q.profit===null?"—":money(row.q.fee+row.q.platformFee+row.q.financeFee)},
    {title:"Ganancia SAEL",key:"profit",render:(_,row)=><div style={{display:"grid",gap:3}}>
      <strong style={{color:row.q.profit===null?"#6b7280":row.q.profit>=p.targetProfit?"#07824c":"#c14646"}}>{row.q.profit===null?"Pendiente":money(row.q.profit)}</strong>
      <TrafficLight q={row.q} target={p.targetProfit}/>
    </div>},
    {title:"Lista sugerida",key:"suggest",render:(_,row)=><div style={{display:"grid",gap:6}}>
      <strong>{row.rec===null?"Falta tasa":money(row.rec)}</strong>
      <Button size="small" disabled={row.rec===null||row.rec===p.tiendaNubeList} onClick={()=>row.rec!==null&&updateProduct({tiendaNubeList:row.rec})}>Modificar</Button>
    </div>},
  ];

  return <div className={styles.root} data-dashboard-full-width="true">
    <div className={styles.heading}>
      <div>
        <Tag color="purple">SAEL · Calculadora comercial</Tag>
        <Title level={2} style={{margin:"8px 0 3px"}}>Precios y ganancias</Title>
        <Paragraph type="secondary" style={{margin:0}}>Simulá un solo producto por vez. Ajustá costo, objetivo, descuentos, cuotas y acreditación para elegir el mejor precio de Tiendanube y Mercado Libre.</Paragraph>
      </div>
      <Button onClick={reset}>Restablecer datos SAEL</Button>
    </div>

    <Card title="1 · Elegí el producto" className={styles.controls}>
      <Radio.Group value={active} onChange={(e)=>setActive(String(e.target.value))} buttonStyle="solid" optionType="button"
        style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {productNames.map(x=><Radio.Button key={x.id} value={x.id} style={{borderRadius:9,fontWeight:700}}>{x.label}</Radio.Button>)}
      </Radio.Group>
      <Text type="secondary" style={{display:"block",marginTop:12,fontSize:12}}>Solo se muestran los cálculos del producto seleccionado. Los valores que edites de cada prenda quedan conservados mientras uses esta pantalla.</Text>
    </Card>

    <Card title="2 · Promoción, cuotas y envío" className={styles.controls}>
      <Row gutter={[18,18]}>
        <Col xs={24} md={12}>
          <Text strong>Descuento promocional</Text>
          <div style={{marginTop:8}}>
            <Radio.Group value={s.discount} optionType="button" buttonStyle="solid" onChange={(e)=>updateState({discount:e.target.value as State["discount"]})}
              options={[{label:"10% OFF",value:10},{label:"15% OFF",value:15},{label:"20% OFF",value:20}]} />
          </div>
          <Text type="secondary" style={{fontSize:11,display:"block",marginTop:7}}>10% habitual; 15% y 20% para ocasiones especiales. El 20% por transferencia se acumula.</Text>
        </Col>
        <Col xs={24} md={12}>
          <Text strong>Cuotas sin interés (solo una opción)</Text>
          <div style={{marginTop:8}}>
            <Radio.Group value={s.installments} optionType="button" buttonStyle="solid" onChange={(e)=>updateState({installments:e.target.value as Term})}
              options={[{label:"1 pago",value:1},{label:"2 cuotas",value:2},{label:"3 cuotas",value:3},{label:"6 cuotas",value:6}]} />
          </div>
          {s.installments>1?<Text type="secondary" style={{display:"block",fontSize:11,marginTop:7}}>
            Mínimo configurado SAEL: {money(min)} en productos con descuento. Cuotas a cargo de SAEL; si faltan tasas, la ganancia queda sin confirmar.
          </Text>:<Text type="secondary" style={{display:"block",fontSize:11,marginTop:7}}>En un pago no se cobra financiación adicional.</Text>}
        </Col>
        <Col xs={24}>
          <Divider style={{margin:"4px 0"}}/>
          <Space wrap size="large">
            <Checkbox checked={s.forceFreeShipping} onChange={(e)=>updateState({forceFreeShipping:e.target.checked})}>
              Envío gratis adicional en Tiendanube (incluso debajo de {money(s.freeThreshold)})
            </Checkbox>
            <Tag color="green">Automático desde {money(s.freeThreshold)} de productos</Tag>
            <Tag color="purple">Friselina: {money(s.bag)} por pedido gratis</Tag>
          </Space>
        </Col>
      </Row>
    </Card>

    <Card title={"3 · Datos y precios · "+p.name} style={{borderRadius:16}}>
      <Row gutter={[16,16]}>
        <Col xs={24} sm={12} lg={6}><MoneyInput label="Costo completo de la prenda" value={p.cost} onChange={(cost)=>updateProduct({cost})} description="Incluye estampado, luz, packaging e IIBB estimado."/></Col>
        <Col xs={24} sm={12} lg={6}><MoneyInput label="Quiero ganar por unidad" value={p.targetProfit} onChange={(targetProfit)=>updateProduct({targetProfit})}/></Col>
        <Col xs={24} sm={12} lg={6}><MoneyInput label="Mi precio de lista · Tiendanube" value={p.tiendaNubeList} onChange={(tiendaNubeList)=>updateProduct({tiendaNubeList})} description="Precio original antes de aplicar el OFF."/></Col>
        <Col xs={24} sm={12} lg={6}><MoneyInput label="Mi precio de lista · Mercado Libre" value={p.mercadoLibreList} onChange={(mercadoLibreList)=>updateProduct({mercadoLibreList})} description="Precio antes de la promoción simulada."/></Col>
      </Row>
      <Row gutter={[14,14]} style={{marginTop:16}}>
        <Col xs={24} md={12}>
          <div style={{background:"#f6f0fa",borderRadius:13,padding:16,border:"1px solid #eadff3"}}>
            <Text type="secondary">TIENDANUBE · PRECIO VISIBLE</Text>
            <div style={{display:"flex",gap:12,alignItems:"baseline",flexWrap:"wrap"}}>
              <Title level={3} style={{margin:0,color:"#642e83"}}>{money(afterTN)}</Title>
              <Text delete type="secondary">{money(p.tiendaNubeList)}</Text>
              <Tag color="magenta">{s.discount}% OFF</Tag>
            </div>
            <Text type="secondary" style={{fontSize:12}}>Transferencia (20% extra): <strong>{money(activeQuotes.transferencia.productPrice)}</strong></Text>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div style={{background:"#f0f5fc",borderRadius:13,padding:16,border:"1px solid #dee8f6"}}>
            <Text type="secondary">MERCADO LIBRE · PRECIO VISIBLE SIMULADO</Text>
            <div style={{display:"flex",gap:12,alignItems:"baseline",flexWrap:"wrap"}}>
              <Title level={3} style={{margin:0,color:"#28549b"}}>{money(afterML)}</Title>
              <Text delete type="secondary">{money(p.mercadoLibreList)}</Text>
              <Tag color="blue">{s.discount}% OFF</Tag>
            </div>
            <Text type="secondary" style={{fontSize:12}}>Cargo ML del artículo: referencia manual, no liquidación confirmada.</Text>
          </div>
        </Col>
      </Row>
    </Card>

    <Card title="4 · ¿Cuándo querés recibir tu dinero?" style={{borderRadius:16}}>
      <Row gutter={[12,12]}>
        {PROVIDERS.map(({key,name})=><Col key={key} xs={24} md={8}>
          <div style={{background:"#fafafd",padding:12,border:"1px solid #e7e9f2",borderRadius:12}}>
            <Text strong style={{display:"block",marginBottom:8}}>{name}</Text>
            <Select style={{width:"100%"}} value={payouts[key]} options={PAYOUT_OPTIONS[key]} onChange={(v)=>payoutsUpdate(key,v)} />
            <Text type="secondary" style={{display:"block",marginTop:8,fontSize:11}}>{key==="pagoNube"?"0% extra de Tiendanube":"2% extra de Tiendanube (plan Esencial)"}</Text>
          </div>
        </Col>)}
      </Row>
      <Text type="secondary" style={{display:"block",marginTop:12,fontSize:11}}>
        NAVE “otros plazos” corresponde a la modalidad publicada (hasta 18 días hábiles según operación); no es una garantía de acreditación exacta a 8 días.
      </Text>
    </Card>

    <Card title="5 · ¿Cuánto ganás realmente en Tiendanube?" style={{borderRadius:16}}>
      {s.installments>1 ? <Alert type="info" showIcon style={{marginBottom:15}}
        message={"Financiación en "+s.installments+" cuotas"}
        description={"Pago Nube usa tarifas de tu propia cuenta. Mercado Pago 2/3 usa tasas de la simulación compartida (confirmar Checkout); NAVE 3 usa tu simulación. Las tasas sin verificar no se sustituyen por estimaciones."}/>
        :null}
      <Table<TnRow> size="middle" scroll={{x:860}} pagination={false} columns={columns} dataSource={rows} />
      <Divider/>
      <Row gutter={[12,12]} align="middle">
        <Col xs={24} md={15}>
          <div style={{border:"1px solid #bdebd2",background:"#f2fbf7",borderRadius:12,padding:14}}>
            <Text strong style={{color:"#00784b"}}>20% extra · transferencia Pago Nube</Text>
            <Row gutter={[10,10]} style={{marginTop:8}}>
              <Col xs={12}><Statistic title="Producto" value={activeQuotes.transferencia.productPrice} precision={0} prefix="$" groupSeparator="."/></Col>
              <Col xs={12}><Statistic title="Ganancia SAEL" value={activeQuotes.transferencia.profit??0} precision={0} prefix="$" groupSeparator="." valueStyle={{color:(activeQuotes.transferencia.profit??0)>=p.targetProfit?"#00804c":"#b85133"}}/></Col>
            </Row>
            <Text type="secondary" style={{fontSize:11}}>Comisión transferencia: 1,50% + IVA = 1,815%. {activeQuotes.transferencia.freeShipping?"Envío gratis y friselina SAEL.":"Envío a cargo del comprador."} Total cliente {money(activeQuotes.transferencia.totalCustomer)}.</Text>
          </div>
        </Col>
        <Col xs={24} md={9}>
          <div style={{display:"grid",gap:6}}>
            <Text strong>Precio mínimo de lista recomendado</Text>
            <Title level={3} style={{margin:0,color:"#642e83"}}>{tnSuggested===null?"Pendiente":money(tnSuggested)}</Title>
            <TrafficLight q={activeQuotes.pagoNube} target={p.targetProfit}/>
            <Tag color={tnStatus==="good"?"success":tnStatus==="bad"?"warning":"processing"}>
              {tnStatus==="good"?"Todos los medios cumplen":tnStatus==="bad"?"Revisar ganancia":"Alguna tasa sin confirmar"}
            </Tag>
            <Button type="primary" disabled={tnSuggested===null||tnSuggested===p.tiendaNubeList}
              onClick={()=>tnSuggested!==null&&updateProduct({tiendaNubeList:tnSuggested})}>Aplicar precio sugerido TN</Button>
            <Text type="secondary" style={{fontSize:11}}>Busca cubrir tu objetivo también en transferencia; solo considera los medios con tasas cargadas.</Text>
          </div>
        </Col>
      </Row>
    </Card>

    <Card title="6 · Mercado Libre" style={{borderRadius:16}}>
      <Alert type="warning" showIcon style={{marginBottom:16}}
        message="Estimación, no comisión oficial en tiempo real"
        description="El 15,5% viene de tu publicación anterior. Desde marzo de 2026 los cargos fijos dependen de categoría y logística. Para una cifra exacta, copiá comisión, cargo fijo, cuotas y envío desde el simulador de esa publicación (o integrá listing_prices mediante backend seguro)." />
      <Row gutter={[14,14]}>
        <Col xs={24} lg={8}>
          <div style={{display:"grid",gap:12}}>
            <RateInput label="Comisión base ML (%)" value={s.mlCommission} ml onChange={(v)=>updateState({mlCommission:clean(v)})}/>
            <MoneyInput label="Cargo fijo ML (debajo del umbral)" value={p.mlFixedFee} onChange={(mlFixedFee)=>updateProduct({mlFixedFee})}/>
            <MoneyInput label="Costo de envío ML para SAEL" value={p.mlShipping} onChange={(mlShipping)=>updateProduct({mlShipping})}/>
            <Checkbox checked={s.forceFreeML} onChange={(e)=>updateState({forceFreeML:e.target.checked})}>Simular envío gratis ML incluso debajo de {money(s.mlFreeFrom)}</Checkbox>
          </div>
        </Col>
        <Col xs={24} lg={16}>
          <Row gutter={[14,14]}>
            <Col xs={12}><Statistic title="Cliente paga por el producto" value={mlQ.productPrice} prefix="$" groupSeparator="."/></Col>
            <Col xs={12}><Statistic title="Ganancia SAEL" value={mlQ.profit??0} prefix="$" groupSeparator="." valueStyle={{color:mlQ.profit===null?"#6b7280":mlQ.profit>=p.targetProfit?"#07824c":"#c14646"}}/></Col>
            <Col xs={12}><Statistic title="Comisión y financiación" value={mlQ.fee+mlQ.financeFee} prefix="$" groupSeparator="."/></Col>
            <Col xs={12}><Statistic title="Cargo fijo + envío" value={mlQ.fixedFee+mlQ.logistics} prefix="$" groupSeparator="."/></Col>
          </Row>
          <Divider/>
          <Row align="middle" justify="space-between" gutter={[12,12]}>
            <Col xs={24} md={14}>
              <TrafficLight q={mlQ} target={p.targetProfit}/>
              <Text type="secondary" style={{display:"block",marginTop:7,fontSize:12}}>
                {mlQ.reason??("Costo total efectivo de vender: "+percent((mlQ.fee+mlQ.financeFee+mlQ.fixedFee+mlQ.logistics)/Math.max(1,mlQ.productPrice)*100))}
              </Text>
              <Text type="secondary" style={{display:"block",fontSize:12}}>
                {s.installments>1?"La tasa adicional de cuotas de ML debe cargarse en Ajustes (no es la de Mercado Pago).":"Sin financiación de cuotas por cuenta de SAEL."}
              </Text>
            </Col>
            <Col xs={24} md={10}>
              <Text type="secondary">Precio mínimo de lista sugerido</Text>
              <Title level={3} style={{margin:"3px 0"}}>{mlSuggested===null?"Falta tasa ML":money(mlSuggested)}</Title>
              <Button block type="primary" disabled={mlSuggested===null||mlSuggested===p.mercadoLibreList} onClick={()=>mlSuggested!==null&&updateProduct({mercadoLibreList:mlSuggested})}>Aplicar precio sugerido ML</Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>

    <Collapse items={[{key:"adjust",label:"7 · Ajustes avanzados: tasas de cuotas, envío y umbrales",children:<>
      <Text type="secondary">Los porcentajes de cuotas de esta sección son costos adicionales ANTES de IVA (excepto ML, que requiere el valor final de tu liquidación). Los vacíos no se calculan.</Text>
      <Row gutter={[15,15]} style={{marginTop:14}}>
        <Col xs={24} sm={12} lg={6}><MoneyInput label="Envío Tiendanube" value={s.shipping} onChange={(shipping)=>updateState({shipping})}/></Col>
        <Col xs={24} sm={12} lg={6}><MoneyInput label="Gratis desde" value={s.freeThreshold} onChange={(freeThreshold)=>updateState({freeThreshold})}/></Col>
        <Col xs={24} sm={12} lg={6}><MoneyInput label="Friselina extra por envío gratis" value={s.bag} onChange={(bag)=>updateState({bag})}/></Col>
        <Col xs={24} sm={12} lg={6}><MoneyInput label="Umbral envío ML (editable)" value={s.mlFreeFrom} onChange={(mlFreeFrom)=>updateState({mlFreeFrom})}/></Col>
        <Col xs={24} sm={8}><MoneyInput label="Mínimo SAEL: 2 cuotas" value={s.min2} onChange={(min2)=>updateState({min2})}/></Col>
        <Col xs={24} sm={8}><MoneyInput label="Mínimo SAEL: 3 cuotas" value={s.min3} onChange={(min3)=>updateState({min3})}/></Col>
        <Col xs={24} sm={8}><MoneyInput label="Mínimo SAEL: 6 cuotas" value={s.min6} onChange={(min6)=>updateState({min6})}/></Col>
      </Row>
      <Divider>Tasas adicionales de financiación</Divider>
      <Row gutter={[16,16]}>
        {(["pagoNube","mercadoPago","nave","mercadoLibre"] as const).map(provider=><Col key={provider} xs={24} lg={12}>
          <div style={{border:"1px solid #e5e7ed",borderRadius:12,padding:13}}>
            <Text strong>{NAMES[provider]}</Text>
            <Row gutter={[10,10]} style={{marginTop:11}}>
              {([2,3,6] as TermRate[]).map(n=><Col xs={8} key={n}>
                <RateInput ml={provider==="mercadoLibre"} label={n+" cuotas"} value={financing[provider][n]} onChange={(v)=>ratesUpdate(provider,n,v)}/>
              </Col>)}
            </Row>
            {provider==="mercadoPago"?<Text type="secondary" style={{fontSize:11}}>2 y 3 de tu captura de Mercado Pago. Para 6 cuotas no precargamos la tasa pública de Link de Pago como si fuera Checkout.</Text>:null}
            {provider==="mercadoLibre"?<Text type="secondary" style={{fontSize:11}}>Usá financiación adicional final del simulador ML, sin sumar IVA dos veces.</Text>:null}
          </div>
        </Col>)}
      </Row>
    </>}]} />

    <Card style={{borderRadius:16,background:"#f9fafc"}}>
      <Title level={4} style={{marginTop:0}}>Recomendación final para {p.name}</Title>
      {tnSuggested!==null&&mlSuggested!==null? <Paragraph>
        Para alcanzar al menos <strong>{money(p.targetProfit)} de contribución por prenda</strong> con los costos configurados, el simulador recomienda una lista de <strong>{money(tnSuggested)} en Tiendanube</strong> y <strong>{money(mlSuggested)} en Mercado Libre</strong>.
        Con descuentos, cuotas y envío los márgenes cambian automáticamente.
      </Paragraph> : <Paragraph>
        La sugerencia es parcial porque faltan comisiones de financiación del canal seleccionado.
        Cargá esas tasas para obtener una comparación completa y evitar publicar con una ganancia ficticia.
      </Paragraph>}
      <Alert type="info" showIcon message="Simulación de contribución, no ganancia final del mes"
        description="No se duplican IIBB, DTF, luz ni packaging incluidos en el costo unitario. Restan gastos fijos, publicidad, devoluciones y retenciones reales que correspondan. Modificar precio solo cambia esta pantalla, nunca las publicaciones sincronizadas."/>
      <Space wrap style={{marginTop:14}}>
        <Link href="https://ayuda.tiendanube.com/pago-nube/cuales-son-las-comisiones-de-pago-nube" target="_blank">Tarifas oficiales de Pago Nube</Link>
        <Link href="https://www.mercadopago.com.ar/herramientas-para-vender/link-de-pago" target="_blank">Cuotas Mercado Pago (referenciales)</Link>
        <Link href="https://developers.mercadolibre.com.ar/comision-por-vender" target="_blank">Comisiones API Mercado Libre</Link>
      </Space>
    </Card>
  </div>;
}
