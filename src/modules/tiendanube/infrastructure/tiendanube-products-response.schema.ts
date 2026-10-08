import { z } from "zod";

const localizedTextSchema = z.object({
  es: z.string().trim().min(1),
});

const variantAttributeSchema = z.object({
  name: localizedTextSchema.nullable(),
  value: localizedTextSchema,
});

const variantSchema = z.object({
  id: z.number().int().positive(),
  attributes: z.array(variantAttributeSchema),
  sku: z.string().nullable(),
  stock: z.number().nullable(),
  stockManagement: z.boolean(),
  price: z.number().nullable(),
  promotionalPrice: z.number().nullable(),
});

const productSchema = z.object({
  id: z.number().int().positive(),
  name: localizedTextSchema,
  mainImage: z.string().nullable(),
  tags: z.array(z.string()),
  published: z.boolean(),
  visibility: z.enum(["visible", "unlisted", "hidden"]),
  variants: z.array(variantSchema),
});

export const tiendanubeProductsResponseSchema = z.object({
  products: z.array(productSchema),
  page: z.number().int().positive(),
  hasMore: z.boolean(),
  total: z.number().int().nonnegative().optional(),
});
