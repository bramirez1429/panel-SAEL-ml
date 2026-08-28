import "server-only";

import { ApiError } from "@/shared/api/api-error";

export function logPromotionCampaignItemsFailure(error: unknown): void {
  if (error instanceof ApiError) {
    console.error("Falló la carga de ítems de una campaña de Mercado Libre.", {
      code: error.code,
      status: error.status ?? null,
      message: error.message,
    });
    return;
  }

  console.error("Falló la carga de ítems de una campaña de Mercado Libre.", {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Error desconocido",
  });
}
