import { z } from "zod";

const identifierListSchema = z.array(z.string().min(1));

const migrationJobSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["DISCOVERING", "QUEUED", "RUNNING", "WAITING_RECONCILIATION", "PAUSED", "COMPLETED", "COMPLETED_WITH_REJECTIONS"]),
  totalItems: z.number().int().nonnegative(),
  processedItems: z.number().int().nonnegative(),
  approvedItems: z.number().int().nonnegative(),
  rejectedItems: z.number().int().nonnegative(),
  currentSourceKey: z.string().min(1).nullable(),
});

const migrationItemSchema = z.object({
  id: z.string().min(1),
  sourceKey: z.string().min(1),
  title: z.string().nullable(),
  mlaIds: identifierListSchema,
  familyId: z.string().nullable(),
  mlauIds: identifierListSchema,
  status: z.enum(["PENDING", "PROCESSING", "RECONCILING", "APPROVED", "REJECTED"]),
  outcome: z.enum(["CREATED", "ALREADY_EXISTS"]).nullable(),
  tiendanubeProductId: z.string().nullable(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  attempts: z.number().int().nonnegative(),
  updatedAt: z.string().min(1),
});

export const tiendanubeMigrationProgressSchema = migrationJobSchema;
export const tiendanubeMigrationActiveResponseSchema = migrationJobSchema.nullable();

export const tiendanubeMigrationResultsPageSchema = z.object({
  items: z.array(migrationItemSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
