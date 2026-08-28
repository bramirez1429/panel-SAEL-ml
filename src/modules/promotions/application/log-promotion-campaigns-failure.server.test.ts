import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/shared/api/api-error";
import { logPromotionCampaignsFailure } from "./log-promotion-campaigns-failure.server";

describe("logPromotionCampaignsFailure", () => {
  afterEach(() => vi.restoreAllMocks());

  it("registra ApiError y redacta credenciales, cookies y headers", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = new ApiError("No autorizado", "API_HTTP_ERROR", {
      status: 401,
      responseBody: {
        message: "Sesión vencida",
        access_token: "token-privado",
        cookie: "session=privada",
        headers: { authorization: "Bearer privado" },
      },
    });

    logPromotionCampaignsFailure(error);

    expect(consoleError).toHaveBeenCalledWith("Falló la carga de campañas de Mercado Libre.", {
      code: "API_HTTP_ERROR",
      status: 401,
      message: "No autorizado",
      responseBody: {
        message: "Sesión vencida",
        access_token: "[REDACTED]",
        cookie: "[REDACTED]",
        headers: "[REDACTED]",
      },
    });
  });
});
