import { z } from "zod";

const identifierListSchema = z.array(z.string().min(1));

const productSchema = z.object({
  title: z.string().min(1),
  mlaIds: identifierListSchema,
  familyId: z.string().min(1).nullable(),
  mlauIds: identifierListSchema,
});

export const tiendanubeMigrationProgressSchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(["PENDING", "DISCOVERING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"]),
  totalProducts: z.number().int().nonnegative().nullable(),
  processedProducts: z.number().int().nonnegative(),
  approvedProducts: z.number().int().nonnegative(),
  rejectedProducts: z.number().int().nonnegative(),
  currentProduct: productSchema.nullable(),
});

export const tiendanubeMigrationActiveResponseSchema = z.object({
  activeMigration: tiendanubeMigrationProgressSchema.nullable(),
});

export const tiendanubeMigrationResultsPageSchema = z.object({
  items: z.array(productSchema.extend({
    id: z.string().min(1),
    rejectionReason: z.string().min(1).nullable(),
    tiendanubeProductId: z.string().min(1).nullable(),
    action: z.enum(["CREATED", "LINKED"]).nullable(),
  })),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
