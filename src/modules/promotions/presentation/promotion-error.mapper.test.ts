import { describe, expect, it } from "vitest";

import { ApiError } from "@/shared/api/api-error";
import { mapPromotionError, promotionErrorMessage } from "./promotion-error.mapper";

const messages: Readonly<Record<string, string>> = {
  PROMOTION_NOT_AVAILABLE_FOR_ALL_ITEMS: "Esta promoción no está disponible para todas las variantes.",
  PROMOTION_CHANGED_DURING_OPERATION: "Mercado Libre modificó la disponibilidad de esta promoción. Volvé a consultar.",
  PROMOTION_TIMEOUT: "Mercado Libre está tardando más de lo esperado. Verificamos el estado antes de finalizar.",
  PROMOTION_PERMISSION_DENIED: "No tenemos permisos para modificar esta promoción.",
  PROMOTION_RATE_LIMITED: "Mercado Libre recibió demasiadas solicitudes. Intentá nuevamente en unos minutos.",
  PROMOTION_PROVIDER_UNAVAILABLE: "Mercado Libre no está disponible temporalmente.",
  PROMOTION_PARTIAL_FAILURE: "La promoción se aplicó sólo a parte de la publicación.",
};

describe("promotion-error.mapper", () => {
  it.each(Object.entries(messages))("traduce %s a un mensaje humano", (code, message) => {
    expect(promotionErrorMessage(code)).toBe(message);
  });

  it("mapea códigos del backend y conserva sólo diagnóstico discreto", () => {
    const failure = mapPromotionError(
      new ApiError("backend", "API_HTTP_ERROR", {
        status: 409,
        responseBody: { code: "PROMOTION_CHANGED_DURING_OPERATION", message: "technical" },
      }),
    );

    expect(failure).toEqual({
      ok: false,
      message: messages.PROMOTION_CHANGED_DURING_OPERATION,
      diagnosticCode: "PROMOTION_CHANGED_DURING_OPERATION",
    });
    expect(failure.message).not.toContain("technical");
  });

  it("no rompe la página ante un error desconocido", () => {
    expect(mapPromotionError(new Error("unexpected"))).toEqual({
      ok: false,
      message: "No pudimos completar la operación de promoción. Volvé a intentarlo.",
    });
  });
});
