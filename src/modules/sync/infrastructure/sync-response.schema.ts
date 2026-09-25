import { z } from "zod";

import { SYNC_STATUSES } from "../domain/sync.model";

const nonNegativeInteger = z.number().int().nonnegative();
const syncStatusSchema = z.enum(SYNC_STATUSES);

const overviewJobSchema = z.object({
  id: z.uuid(),
  status: syncStatusSchema,
  totalItems: nonNegativeInteger,
  processedItems: nonNegativeInteger,
  successfulItems: nonNegativeInteger,
  failedItems: nonNegativeInteger,
});

export const syncOverviewResponseSchema = z.object({
  activeSync: overviewJobSchema.extend({
    percent: z.number(),
    startedAt: z.iso.datetime().nullable(),
  }).nullable(),
  latestSync: overviewJobSchema.extend({
    finishedAt: z.iso.datetime().nullable(),
  }).nullable(),
  nextAutomaticSyncAt: z.iso.datetime(),
  openErrorsCount: nonNegativeInteger,
  openIntegrationEventsCount: nonNegativeInteger,
});

export const startSyncResponseSchema = z.object({
  ok: z.literal(true),
  syncId: z.uuid(),
  status: z.enum(["PENDING", "RUNNING"]),
  created: z.boolean(),
});

export const syncStatusResponseSchema = z.object({
  ok: z.literal(true),
  syncId: z.uuid(),
  status: syncStatusSchema,
  totalItems: nonNegativeInteger,
  processedItems: nonNegativeInteger,
  successfulItems: nonNegativeInteger,
  failedItems: nonNegativeInteger,
  percent: z.number(),
  productsSaved: nonNegativeInteger,
  childrenSaved: nonNegativeInteger,
  errorsCount: nonNegativeInteger,
  lastError: z.string().nullable(),
  hasMore: z.boolean(),
});

export const syncErrorResponseSchema = z.object({
  id: z.uuid(),
  sync_job_id: z.uuid().nullable(),
  seller_id: nonNegativeInteger,
  item_id: z.string().min(1),
  family_id: z.string().nullable(),
  error_type: z.enum([
    "PUBLICATION_ERROR",
    "VALIDATION_ERROR",
    "AUTH_ERROR",
    "RATE_LIMIT",
    "PROVIDER_TEMPORARY_ERROR",
    "POSSIBLE_API_CHANGE",
    "MIRROR_WRITE_FAILED",
  ]),
  error_code: z.string().nullable(),
  error_message: z.string().min(1),
  attempts: nonNegativeInteger,
  status: z.enum(["OPEN", "RETRYING", "RESOLVED"]),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  resolved_at: z.iso.datetime().nullable(),
});

export const syncErrorsResponseSchema = z.array(syncErrorResponseSchema);

export const retrySyncErrorsResponseSchema = z.object({
  syncId: z.uuid(),
  retriedItems: nonNegativeInteger,
  resolvedItems: nonNegativeInteger,
  openErrorsCount: nonNegativeInteger,
});
