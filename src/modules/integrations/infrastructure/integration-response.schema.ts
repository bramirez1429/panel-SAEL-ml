import { z } from "zod";

export const mercadoLibreConnectionSchema = z.discriminatedUnion("connected", [
  z.object({ connected: z.literal(true), sellerId: z.number().int() }),
  z.object({ connected: z.literal(false) }),
]);

export const tiendanubeConnectionSchema = z.discriminatedUnion("connected", [
  z.object({ connected: z.literal(true), storeId: z.string().min(1), scope: z.string().optional() }),
  z.object({ connected: z.literal(false) }),
]);

export type MercadoLibreConnectionDto = z.infer<typeof mercadoLibreConnectionSchema>;
export type TiendanubeConnectionDto = z.infer<typeof tiendanubeConnectionSchema>;
