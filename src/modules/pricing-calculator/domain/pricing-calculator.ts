export type Provider = "pagoNube" | "mercadoPago" | "nave" | "transferencia";
export type Installments = 1 | 2 | 3;

export type Product = {
  id: string;
  name: string;
  cost: number;
  tiendaNubeList: number;
  mercadoLibreList: number;
  targetProfit: number;
  quantity: number;
  mlFixedFee: number;
  mlShipping: number;
};

export type Settings = {
  discount: 10 | 15 | 20;
  installments: Installments;
  freeShippingFrom: number;
  shipping: number;
  freeShippingBag: number;
  transferDiscount: number;
  pagoNubeOne: number;
  transferencia: number;
  mercadoPagoOne: number;
  naveOne: number;
  tiendaNubeThirdParty: number;
  mlCommission: number;
  mlFinancing2: number | null;
  mlFinancing3: number | null;
  pagoNubeFinancing2: number | null;
  pagoNubeFinancing3: number | null;
  mercadoPagoFinancing2: number | null;
  mercadoPagoFinancing3: number | null;
  naveFinancing2: number | null;
  naveFinancing3: number | null;
};

export type Quote = {
  productPrice: number;
  shippingCharged: number;
  totalCustomer: number;
  processingFee: number;
  financeFee: number;
  platformFee: number;
  shippingExpense: number;
  bagExpense: number;
  fixedFee: number;
  costs: number;
  profit: number;
  rate: number;
  freeShipping: boolean;
  installments: Installments;
};

export const PRODUCTS: Product[] = [
  { id: "rem-mujer", name: "Remera mujer", cost: 12000, tiendaNubeList: 31999, mercadoLibreList: 41900, targetProfit: 6000, quantity: 0, mlFixedFee: 2800, mlShipping: 7790 },
  { id: "rem-nina", name: "Remera niña", cost: 7100, tiendaNubeList: 22221, mercadoLibreList: 27900, targetProfit: 4000, quantity: 0, mlFixedFee: 2800, mlShipping: 7790 },
  { id: "buzo-mujer", name: "Buzo mujer", cost: 21000, tiendaNubeList: 59900, mercadoLibreList: 61900, targetProfit: 10000, quantity: 0, mlFixedFee: 2800, mlShipping: 8290 },
  { id: "buzo-nina", name: "Buzo niña cuello redondo", cost: 17000, tiendaNubeList: 47900, mercadoLibreList: 51900, targetProfit: 7000, quantity: 0, mlFixedFee: 2800, mlShipping: 8290 },
  { id: "hoodie-nina", name: "Hoodie niña", cost: 20000, tiendaNubeList: 54900, mercadoLibreList: 59900, targetProfit: 8000, quantity: 0, mlFixedFee: 2800, mlShipping: 8290 },
];

export const SETTINGS: Settings = {
  discount: 10,
  installments: 1,
  freeShippingFrom: 90000,
  shipping: 11000,
  freeShippingBag: 1000,
  transferDiscount: 20,
  pagoNubeOne: 4.39 * 1.21,
  transferencia: 1.5 * 1.21,
  mercadoPagoOne: 4.39 * 1.21,
  naveOne: 4.8 * 1.21,
  tiendaNubeThirdParty: 2,
  mlCommission: 15.5,
  mlFinancing2: null,
  mlFinancing3: 8.9,
  pagoNubeFinancing2: null,
  pagoNubeFinancing3: 11.69 * 1.21,
  mercadoPagoFinancing2: null,
  mercadoPagoFinancing3: 10.49 * 1.21,
  naveFinancing2: null,
  naveFinancing3: 5.76 * 1.21,
};

export const MONEY = new Intl.NumberFormat("es-AR", {
  style: "currency", currency: "ARS", maximumFractionDigits: 0,
});

const nonnegative = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0);
const discounted = (list: number, discount: number) => Math.round(nonnegative(list) * (1 - discount / 100));

export function minimumInstallmentAmount(installments: Installments): number {
  return installments === 2 ? 25000 : installments === 3 ? 32000 : 0;
}

export function financingRate(provider: Provider, installments: Installments, s: Settings): number | null {
  if (installments === 1 || provider === "transferencia") return 0;
  if (provider === "pagoNube") return installments === 2 ? s.pagoNubeFinancing2 : s.pagoNubeFinancing3;
  if (provider === "mercadoPago") return installments === 2 ? s.mercadoPagoFinancing2 : s.mercadoPagoFinancing3;
  return installments === 2 ? s.naveFinancing2 : s.naveFinancing3;
}

export function tnQuote(list: number, cost: number, provider: Provider, s: Settings, installments: Installments = 1): Quote | null {
  if (provider === "transferencia" && installments !== 1) return null;
  const price = discounted(list, s.discount) * (provider === "transferencia" ? 1 - s.transferDiscount / 100 : 1);
  const productPrice = Math.round(price);
  if (productPrice < minimumInstallmentAmount(installments)) return null;
  const finance = financingRate(provider, installments, s);
  if (finance === null) return null;
  const freeShipping = productPrice >= s.freeShippingFrom;
  const shippingCharged = freeShipping ? 0 : s.shipping;
  const totalCustomer = productPrice + shippingCharged;
  const processingRate = provider === "transferencia" ? s.transferencia :
    provider === "pagoNube" ? s.pagoNubeOne :
    provider === "mercadoPago" ? s.mercadoPagoOne : s.naveOne;
  const platformRate = provider === "pagoNube" || provider === "transferencia" ? 0 : s.tiendaNubeThirdParty;
  const processingFee = totalCustomer * processingRate / 100;
  const platformFee = totalCustomer * platformRate / 100;
  const financeFee = totalCustomer * finance / 100;
  const shippingExpense = s.shipping;
  const bagExpense = freeShipping ? s.freeShippingBag : 0;
  return {
    productPrice, shippingCharged, totalCustomer, processingFee, financeFee, platformFee,
    shippingExpense, bagExpense, fixedFee: 0, costs: cost,
    profit: totalCustomer - processingFee - financeFee - platformFee - shippingExpense - bagExpense - cost,
    rate: processingRate + platformRate + finance, freeShipping, installments,
  };
}

export function mlQuote(product: Product, s: Settings, installments: Installments = 1, list?: number): Quote | null {
  const productPrice = discounted(list ?? product.mercadoLibreList, s.discount);
  if (productPrice < minimumInstallmentAmount(installments)) return null;
  const additionalFinance = installments === 1 ? 0 : installments === 2 ? s.mlFinancing2 : s.mlFinancing3;
  if (additionalFinance === null) return null;
  // La logística y el cargo fijo dependen del artículo: valores configurables por publicación.
  const fixedFee = productPrice < 33000 ? product.mlFixedFee : 0;
  const shippingExpense = productPrice >= 33000 ? product.mlShipping : 0;
  const processingFee = productPrice * s.mlCommission / 100;
  const financeFee = productPrice * additionalFinance / 100;
  return {
    productPrice, shippingCharged: 0, totalCustomer: productPrice,
    processingFee, financeFee, platformFee: 0, shippingExpense, bagExpense: 0,
    fixedFee, costs: product.cost,
    profit: productPrice - processingFee - financeFee - fixedFee - shippingExpense - product.cost,
    rate: s.mlCommission + additionalFinance, freeShipping: productPrice >= 33000, installments,
  };
}

export const PAYMENTS: ReadonlyArray<{ key: Provider; label: string }> = [
  { key: "pagoNube", label: "Pago Nube" },
  { key: "mercadoPago", label: "Mercado Pago" },
  { key: "nave", label: "NAVE" },
];

export function recommendedTN(p: Product, s: Settings): number | null {
  const providers: Provider[] = ["pagoNube", "mercadoPago", "nave"];
  for (let list = 1000; list <= 400000; list += 100) {
    const transfer = tnQuote(list, p.cost, "transferencia", s);
    if (!transfer || transfer.profit < p.targetProfit) continue;
    let ok = true;
    for (const provider of providers) {
      const one = tnQuote(list, p.cost, provider, s, 1);
      if (!one || one.profit < p.targetProfit) { ok = false; break; }
      if (s.installments > 1) {
        const financed = tnQuote(list, p.cost, provider, s, s.installments);
        // Sin tasa confirmada, no se promete la ganancia de esa financiación.
        if (financingRate(provider, s.installments, s) !== null && (!financed || financed.profit < p.targetProfit)) {
          ok = false; break;
        }
      }
    }
    if (ok) return list;
  }
  return null;
}

export function recommendedML(p: Product, s: Settings): number | null {
  if (s.installments > 1 && (s.installments === 2 ? s.mlFinancing2 : s.mlFinancing3) === null) return null;
  for (let list = 1000; list <= 400000; list += 100) {
    const one = mlQuote(p, s, 1, list);
    const selected = mlQuote(p, s, s.installments, list);
    if (one && selected && one.profit >= p.targetProfit && selected.profit >= p.targetProfit) return list;
  }
  return null;
}
