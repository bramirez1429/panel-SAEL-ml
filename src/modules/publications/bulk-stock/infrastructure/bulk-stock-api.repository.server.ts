import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { HttpGetClient, HttpPostClient } from "@/shared/api/http-client.server";

import type {
  BulkStockJob,
  BulkStockJobItem,
  BulkStockJobItemState,
  BulkStockJobState,
  BulkStockPublicationType,
  BulkStockPreview,
  BulkStockPreviewRequest,
  BulkStockPreviewSummary,
  BulkStockVariant,
  CreateBulkStockJobRequest,
} from "../domain/bulk-stock.model";

const BULK_STOCK_ENDPOINT = "/mercadolibre/direct/stock-bulk";
const BULK_STOCK_TIMEOUT_MS = 60_000;

type BulkStockHttpClient = HttpGetClient & HttpPostClient;

/** Única capa que conoce el contrato HTTP del proceso de stock masivo. */
export class BulkStockApiRepository {
  constructor(private readonly httpClient: BulkStockHttpClient) {}

  async preview(request: BulkStockPreviewRequest): Promise<BulkStockPreview> {
    const response = await this.httpClient.post(
      `${BULK_STOCK_ENDPOINT}/preview`,
      request,
      { timeoutMs: BULK_STOCK_TIMEOUT_MS },
    );
    return mapPreview(response);
  }

  async createJob(request: CreateBulkStockJobRequest): Promise<Readonly<{ jobId: string }>> {
    const response = unwrapData(await this.httpClient.post(
      `${BULK_STOCK_ENDPOINT}/jobs`,
      request,
      { timeoutMs: BULK_STOCK_TIMEOUT_MS },
    ));
    const jobId = readString(response, ["jobId", "id"]);
    if (!jobId) throw invalidResponse("El backend no devolvió el identificador del proceso.");
    return { jobId };
  }

  async getJob(jobId: string): Promise<BulkStockJob> {
    const response = await this.httpClient.get(
      `${BULK_STOCK_ENDPOINT}/jobs/${encodeURIComponent(jobId)}`,
      { timeoutMs: BULK_STOCK_TIMEOUT_MS },
    );
    return mapJob(response, jobId);
  }
}

function mapPreview(value: unknown): BulkStockPreview {
  const response = unwrapData(value);
  const rawVariants = readArray(response, ["results"]);
  if (!rawVariants) throw invalidResponse("El backend devolvió una vista previa inválida.");
  const variants = rawVariants.map(mapPreviewVariant);
  const summarySource = readRecord(response, ["summary"]);
  if (!summarySource) throw invalidResponse("El backend devolvió un resumen de vista previa inválido.");
  return {
    previewId: null,
    summary: mapPreviewSummary(summarySource, variants),
    variants,
  };
}

function mapPreviewVariant(value: unknown, index: number): BulkStockVariant {
  const item = asRecord(value);
  const identifier = readString(item, ["identifier"]);
  const itemId = readString(item, ["itemId"]);
  const familyId = readString(item, ["familyId"]);
  const variationId = readStringOrNumber(item, ["variationId"]);
  const userProductId = readString(item, ["userProductId"]);
  const size = readString(item, ["size"]);
  const currentStock = readInteger(item, ["currentQuantity"]);
  const newStock = readInteger(item, ["requestedQuantity"]);
  const rawType = readString(item, ["model"]);
  if (!identifier || !itemId || !size || currentStock === null || newStock === null) {
    throw invalidResponse(`La variante ${index + 1} de la vista previa es inválida.`);
  }
  const publicationType = rawType === "USER_PRODUCT"
    ? "USER_PRODUCT"
    : rawType === "LEGACY"
      ? "LEGACY"
      : null;
  if (!publicationType) throw invalidResponse(`El tipo de la variante ${index + 1} es inválido.`);

  return {
    key: identifier,
    itemId,
    familyId,
    variationId,
    userProductId,
    model: publicationType,
    title: readString(item, ["title"]) ?? "Variante sin título",
    color: readString(item, ["color"]),
    size,
    publicationType,
    currentStock,
    newStock,
    currentQuantity: currentStock,
    requestedQuantity: newStock,
    currentStatus: readString(item, ["currentStatus"]),
    status: readString(item, ["currentStatus"]) ?? "Sin estado",
    editable: readBoolean(item, ["editable"], false),
    needsChange: readBoolean(item, ["needsChange"], currentStock !== newStock),
    reason: readString(item, ["reason"]),
    storeId: readString(item, ["storeId"]),
    networkNodeId: readString(item, ["networkNodeId"]),
  };
}

function mapPreviewSummary(
  source: Record<string, unknown>,
  variants: readonly BulkStockVariant[],
): BulkStockPreviewSummary {
  return {
    found: readCount(source, ["totalFound"], variants.length),
    editable: readCount(source, ["editable"], variants.filter((item) => item.editable && item.needsChange).length),
    active: readCount(source, ["active"], countStatus(variants, "active")),
    paused: readCount(source, ["paused"], countStatus(variants, "paused")),
    outOfStock: readCount(source, ["outOfStock"], variants.filter((item) => item.currentStock === 0).length),
    unchanged: readCount(source, ["unchanged"], variants.filter((item) => !item.needsChange).length),
    userProduct: readCount(source, ["userProduct"], variants.filter((item) => item.publicationType === "USER_PRODUCT").length),
    legacy: readCount(source, ["legacy"], variants.filter((item) => item.publicationType === "LEGACY").length),
  };
}

function mapJob(value: unknown, requestedJobId: string): BulkStockJob {
  const response = unwrapData(value);
  const jobId = readString(response, ["jobId", "id"]) ?? requestedJobId;
  const status = normalizeJobState(readString(response, ["status", "state"]));
  const rawItems = readArray(response, ["items", "variants", "results"]) ?? [];
  const items = rawItems.map(mapJobItem);
  const counts = readRecord(response, ["summary", "progress", "totals"]) ?? response;
  const total = readCount(counts, ["totalItems", "total"], items.length);
  const succeeded = readCount(counts, ["successfulItems", "succeeded", "success", "correct", "updated"], countJobItems(items, "SUCCESS"));
  const errors = readCount(counts, ["failedItems", "errors", "failed", "error"], countJobItems(items, "ERROR"));
  const skipped = readCount(counts, ["skippedItems", "skipped", "unchanged", "noChanges"], countJobItems(items, "SKIPPED"));
  const processed = readCount(counts, ["processedItems", "processed", "completed"], succeeded + errors + skipped);
  return {
    jobId,
    status,
    processed,
    total,
    succeeded,
    errors,
    skipped,
    pending: readCount(counts, ["pending", "remaining"], Math.max(0, total - processed)),
    items,
  };
}

function mapJobItem(value: unknown, index: number): BulkStockJobItem {
  const item = asRecord(value);
  const itemId = readString(item, ["itemId"]);
  const variationId = readStringOrNumber(item, ["variationId"]);
  const userProductId = readString(item, ["userProductId"]);
  const identifier = readString(item, ["identifier"]);
  const size = readString(item, ["size"]) ?? "—";
  return {
    key: identifier ?? [itemId, variationId, userProductId, size, index].filter(Boolean).join(":"),
    identifier: identifier ?? undefined,
    title: readString(item, ["title"]) ?? "Variante",
    color: readString(item, ["color"]),
    size,
    previousStock: readInteger(item, ["previousQuantity", "previousStock", "currentStock", "oldStock"]),
    newStock: readInteger(item, ["requestedQuantity", "newStock", "targetStock", "stock"]),
    familyId: readString(item, ["familyId"]),
    model: normalizePublicationType(readString(item, ["model"])),
    previousStatus: readString(item, ["previousStatus"]),
    editable: readBoolean(item, ["editable"], false),
    reason: readString(item, ["reason"]),
    storeId: readString(item, ["storeId"]),
    networkNodeId: readString(item, ["networkNodeId"]),
    status: normalizeJobItemState(readString(item, ["status", "state"])),
    message: readString(item, ["error", "message", "errorMessage"]),
    itemId,
    variationId,
    userProductId,
  };
}

function normalizeJobState(value: string | null): BulkStockJobState {
  const state = value?.trim().toUpperCase();
  if (state === "PENDING" || state === "QUEUED") return "PENDING";
  if (state === "PROCESSING" || state === "RUNNING" || state === "IN_PROGRESS") return "PROCESSING";
  if (state === "COMPLETED" || state === "COMPLETED_WITH_ERRORS" || state === "FINISHED" || state === "SUCCESS") return "COMPLETED";
  if (state === "FAILED" || state === "ERROR") return "FAILED";
  throw invalidResponse("El backend devolvió un estado de proceso inválido.");
}

function normalizePublicationType(value: string | null): BulkStockPublicationType | undefined {
  return value === "USER_PRODUCT" || value === "LEGACY" ? value : undefined;
}

function normalizeJobItemState(value: string | null): BulkStockJobItemState {
  const state = value?.trim().toUpperCase();
  if (state === "PENDING" || state === "QUEUED") return "PENDING";
  if (state === "PROCESSING" || state === "RUNNING" || state === "IN_PROGRESS") return "PROCESSING";
  if (state === "SUCCESS" || state === "UPDATED" || state === "COMPLETED") return "SUCCESS";
  if (state === "ERROR" || state === "FAILED") return "ERROR";
  if (state === "SKIPPED" || state === "UNCHANGED" || state === "NO_CHANGES") return "SKIPPED";
  return "PENDING";
}

function unwrapData(value: unknown): Record<string, unknown> {
  const response = asRecord(value);
  const data = response.data;
  return isRecord(data) ? data : response;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw invalidResponse("El backend devolvió una respuesta inválida.");
  return value;
}

function readRecord(source: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> | null {
  for (const key of keys) if (isRecord(source[key])) return source[key];
  return null;
}

function readArray(source: Record<string, unknown>, keys: readonly string[]): readonly unknown[] | null {
  for (const key of keys) if (Array.isArray(source[key])) return source[key];
  return null;
}

function readString(source: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function readStringOrNumber(source: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if ((typeof value === "string" && value.trim()) || typeof value === "number") return String(value);
  }
  return null;
}

function readInteger(source: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  }
  return null;
}

function readBoolean(source: Record<string, unknown>, keys: readonly string[], fallback: boolean): boolean {
  for (const key of keys) if (typeof source[key] === "boolean") return source[key];
  return fallback;
}

function readCount(source: Record<string, unknown>, keys: readonly string[], fallback: number): number {
  return readInteger(source, keys) ?? fallback;
}

function countStatus(variants: readonly BulkStockVariant[], status: string): number {
  return variants.filter((item) => item.status.trim().toLowerCase() === status).length;
}

function countJobItems(items: readonly BulkStockJobItem[], status: BulkStockJobItemState): number {
  return items.filter((item) => item.status === status).length;
}

function invalidResponse(message: string): ApiError {
  return new ApiError(message, "API_INVALID_RESPONSE");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
