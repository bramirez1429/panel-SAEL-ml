import { ApiError } from "@/shared/api/api-error";

const REDACTED = "[REDACTED]";
const SENSITIVE_KEY = /authorization|cookie|headers?|password|secret|token|api[-_]?key/i;

export function logPromotionCampaignsFailure(error: unknown): void {
  if (error instanceof ApiError) {
    console.error("Falló la carga de campañas de Mercado Libre.", {
      code: error.code,
      status: error.status ?? null,
      message: error.message,
      responseBody: sanitize(error.responseBody),
    });
    return;
  }

  console.error("Falló la carga de campañas de Mercado Libre.", {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Error desconocido",
  });
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[TRUNCATED]";
  if (typeof value === "string") {
    return value.replace(/(Bearer\s+)[^\s"']+/gi, `$1${REDACTED}`);
  }
  if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1));
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    SENSITIVE_KEY.test(key) ? REDACTED : sanitize(item, depth + 1),
  ]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
