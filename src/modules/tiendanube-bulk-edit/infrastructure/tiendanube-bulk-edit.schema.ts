import { z } from "zod";

const count = z.number().int().nonnegative();
const field = z.enum(["price", "promotionalPrice", "stock"]);
const decimal = z.string().regex(/^\d+(?:\.\d+)?$/);
const locationSchema = z.object({ id: z.string().min(1) });
const variantSchema = z.object({
  id: z.string().min(1), sku: z.string().nullable(), size: z.string().nullable(), color: z.string().nullable(),
  price: decimal, promotionalPrice: decimal.nullable(), stock: count.nullable(),
});
const productSchema = z.object({ id: z.string().min(1), name: z.string().min(1), variants: z.array(variantSchema) });

export const categorySummarySchema = z.object({
  categoryId: z.string().min(1),
  productCount: count,
  variantCount: count,
  locations: z.array(locationSchema),
  products: z.array(productSchema),
});

export const previewSchema = z.object({
  id: z.string().min(1), categoryId: z.string().min(1), productCount: count, variantCount: count,
  products: z.array(productSchema), locations: z.array(locationSchema),
  changes: z.object({ price: decimal.optional(), promotionalPrice: decimal.optional(), stock: count.optional() }),
  preservedFields: z.array(field),
  incompatibilities: z.array(z.object({ variantId: z.string().min(1), reason: z.string().min(1) })),
  generatedAt: z.string().datetime(), expiresAt: z.string().datetime(),
});

export const jobSchema = z.object({
  id: z.string().min(1), status: z.enum(["QUEUED", "RUNNING", "COMPLETED", "COMPLETED_WITH_ERRORS", "PAUSED", "FAILED"]),
  totalProducts: count, totalVariants: count, completedVariants: count, failedVariants: count, pendingVariants: count,
});

export const activeJobSchema = jobSchema.nullable();
