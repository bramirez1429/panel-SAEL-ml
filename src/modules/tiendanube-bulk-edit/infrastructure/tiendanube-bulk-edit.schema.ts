import { z } from "zod";

const count = z.number().int().nonnegative();
const field = z.enum(["price", "promotionalPrice", "stock"]);

export const categorySummarySchema = z.object({
  productCount: count,
  variantCount: count,
  locations: z.array(z.object({ id: z.string().min(1), name: z.string().min(1) })),
  products: z.array(z.object({
    id: z.union([z.string(), z.number()]).transform(String),
    name: z.string().min(1),
    variants: z.array(z.object({
      id: z.union([z.string(), z.number()]).transform(String), sku: z.string().nullable(), size: z.string().nullable(), color: z.string().nullable(),
      price: z.number().nullable(), promotionalPrice: z.number().nullable(), stock: z.number().nullable(),
    })),
  })),
});

export const previewSchema = z.object({
  id: z.string().min(1), categoryId: z.number().int().positive(), productCount: count, variantCount: count,
  changes: z.object({ price: z.number().optional(), promotionalPrice: z.number().optional(), stock: z.number().int().optional() }),
  preservedFields: z.array(field), incompatibilities: z.array(z.string()),
});

export const jobSchema = z.object({
  id: z.string().min(1), status: z.enum(["QUEUED", "RUNNING", "COMPLETED", "COMPLETED_WITH_ERRORS", "PAUSED", "FAILED"]),
  totalProducts: count, totalVariants: count, updatedVariants: count, failedVariants: count, pendingVariants: count,
});

export const activeJobSchema = jobSchema.nullable();

export const failuresPageSchema = z.object({
  total: count,
  items: z.array(z.object({
    id: z.string().min(1), productName: z.string().min(1), tiendanubeProductId: z.string().min(1), variantId: z.string().min(1),
    sku: z.string().nullable(), size: z.string().nullable(), color: z.string().nullable(), field,
    message: z.string().min(1), technicalDetail: z.string().nullable(), status: z.enum(["PENDING_RETRY", "FAILED"]), adminUrl: z.string().url().nullable(),
  })),
});
