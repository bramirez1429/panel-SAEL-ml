import { ApiError } from "@/shared/api/api-error";

import type { PromotionActionFailure } from "../domain/promotion-action.model";

const HUMAN_MESSAGES: Readonly<Record<string, string>> = {
  PROMOTION_NOT_AVAILABLE_FOR_ALL_ITEMS:
    "Esta promoción no está disponible para todas las variantes.",
  PROMOTION_CHANGED_DURING_OPERATION:
    "Mercado Libre modificó la disponibilidad de esta promoción. Volvé a consultar.",
  PROMOTION_TIMEOUT:
    "Mercado Libre está tardando más de lo esperado. Verificamos el estado antes de finalizar.",
  PROMOTION_PERMISSION_DENIED:
    "No tenemos permisos para modificar esta promoción.",
  PROMOTION_RATE_LIMITED:
    "Mercado Libre recibió demasiadas solicitudes. Intentá nuevamente en unos minutos.",
  PROMOTION_PROVIDER_UNAVAILABLE:
    "Mercado Libre no está disponible temporalmente.",
  PROMOTION_PARTIAL_FAILURE:
    "La promoción se aplicó sólo a parte de la publicación.",
  PROMOTION_NOT_FOUND: "La promoción ya no está disponible.",
  PROMOTION_NOT_APPLICABLE:
    "Esta promoción ya no puede aplicarse a la publicación.",
  PROMOTION_REMOVAL_FAILED: "No se pudo desactivar la promoción completa.",
  PROMOTION_APPLICATION_FAILED: "No se pudo aplicar la promoción completa.",
  PROMOTION_VERIFICATION_FAILED:
    "No pudimos confirmar el estado final de la promoción.",
};

const UNKNOWN_ERROR_MESSAGE =
  "No pudimos completar la operación de promoción. Volvé a intentarlo.";

export function promotionErrorMessage(code: string | undefined): string {
  return code ? (HUMAN_MESSAGES[code] ?? UNKNOWN_ERROR_MESSAGE) : UNKNOWN_ERROR_MESSAGE;
}

export function mapPromotionError(error: unknown): PromotionActionFailure {
  if (error instanceof ApiError && error.code === "API_TIMEOUT") {
    return {
      ok: false,
      message: promotionErrorMessage("PROMOTION_TIMEOUT"),
      diagnosticCode: "PROMOTION_TIMEOUT",
    };
  }
  const diagnosticCode = backendErrorCode(error);
  return {
    ok: false,
    message: promotionErrorMessage(diagnosticCode),
    ...(diagnosticCode ? { diagnosticCode } : {}),
  };
}

function backendErrorCode(error: unknown): string | undefined {
  if (!(error instanceof ApiError) || !isRecord(error.responseBody))
    return undefined;
  const code = error.responseBody.code;
  return typeof code === "string" && code.trim() ? code.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
