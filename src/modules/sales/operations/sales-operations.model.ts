import { z } from "zod";

export const channelSchema = z.enum(["MERCADOLIBRE", "TIENDANUBE"]);
export const orderKeySchema = z.object({
  channel: channelSchema,
  orderId: z.string().regex(/^[1-9]\d{0,39}$/),
});
const lineSchema = z.object({
  id: z.string(), productName: z.string(), sku: z.string().nullable(),
  quantity: z.number().int().positive(), color: z.string().nullable(),
  size: z.string().nullable(), imageUrl: z.string().nullable(),
  unitPrice: z.number().nullable(), mlItemId: z.string().nullable(),
  tnProductId: z.string().nullable(),
});
export const orderSchema = orderKeySchema.extend({
  soldAt: z.string(), status: z.enum(["PENDING","COMPLETED","CANCELLED"]),
  buyer: z.string().nullable(), shippingStatus: z.string().nullable(),
  completedAt: z.string().nullable(), completedBy: z.string().nullable(),
  unread: z.boolean(), quantity: z.number(), amount: z.number().nullable(),
  currency: z.string().nullable(), lines: z.array(lineSchema),
});
export const operationsSchema = z.object({
  today: z.string(), days: z.number(), orders: z.array(orderSchema),
  summary: z.object({
    sales: z.number(), pending: z.number(), completed: z.number(),
    cancelled: z.number(), ml: z.number(), tn: z.number(), unread: z.number(),
  }),
});
export type OrderKey = z.infer<typeof orderKeySchema>;
export type SaleOrder = z.infer<typeof orderSchema>;
export type SalesOperations = z.infer<typeof operationsSchema>;

export const channelLabel = (channel: SaleOrder["channel"]) =>
  channel === "MERCADOLIBRE" ? "Mercado Libre" : "Tienda Nube";
export const argentinaDate = (date: string) => new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short",
}).format(new Date(date));
export const money = (amount: number | null, currency: string | null) => {
  if (amount === null || !currency) return "Sin dato";
  try { return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(amount); }
  catch { return amount.toLocaleString("es-AR") + " " + currency; }
};


export type SalesPeriod = "today" | "yesterday" | "week" | "month";
export type SalesChannelFilter = "ALL" | SaleOrder["channel"];
export const salesPeriodLabels: Record<SalesPeriod, string> = {
  today: "Hoy", yesterday: "Ayer", week: "Últimos 7 días", month: "Últimos 31 días",
};
export function argentinaOrderDay(value: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return [part("year"), part("month"), part("day")].join("-");
}
function shiftDay(day: string, delta: number): string {
  const date = new Date(day + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}
export function selectSalesOrders(orders: readonly SaleOrder[], today: string, period: SalesPeriod, channel: SalesChannelFilter, search = "") {
  const start = shiftDay(today, period === "today" ? 0 : period === "yesterday" ? -1 : period === "week" ? -6 : -30);
  const end = period === "yesterday" ? start : today;
  const q = search.trim().toLocaleLowerCase("es");
  return orders.filter((order) => {
    const day = argentinaOrderDay(order.soldAt);
    return day >= start && day <= end &&
      (channel === "ALL" || order.channel === channel) &&
      (!q || [order.orderId, order.buyer, ...order.lines.flatMap((line) => [line.productName, line.sku])].some((value) => value?.toLocaleLowerCase("es").includes(q)));
  });
}
export function summarizeSalesOrders(orders: readonly SaleOrder[]): SalesOperations["summary"] {
  const summary = { sales: 0, pending: 0, completed: 0, cancelled: 0, ml: 0, tn: 0, unread: 0 };
  for (const order of orders) {
    if (order.status === "CANCELLED") { summary.cancelled++; continue; }
    summary.sales++;
    if (order.status === "PENDING") summary.pending++;
    else summary.completed++;
    if (order.channel === "MERCADOLIBRE") summary.ml++;
    else summary.tn++;
    if (order.unread) summary.unread++;
  }
  return summary;
}
