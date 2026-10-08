import { z } from "zod";

const variantSchema = z.object({
  id: z.string().min(1),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  stock: z.number().nullable(),
  price: z.number().nullable(),
  promotionalPrice: z.number().nullable(),
});

const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  imageUrl: z.string().nullable().optional(),
  status: z.string().min(1),
  tags: z.array(z.string()).optional(),
  variants: z.array(variantSchema),
});

export const tiendanubeProductsResponseSchema = z.object({
  items: z.array(productSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
