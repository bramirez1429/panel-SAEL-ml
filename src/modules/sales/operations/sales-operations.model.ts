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
