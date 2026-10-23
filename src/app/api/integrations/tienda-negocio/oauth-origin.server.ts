import "server-only";

import { ApiError } from "@/shared/api/api-error";

type Environment = Readonly<Record<string, string | undefined>>;

export function getTiendaNegocioOAuthOrigin(environment: Environment = process.env): string {
  const value = environment.TIENDA_NEGOCIO_OAUTH_ORIGIN?.trim();
  if (!value) {
    throw new ApiError(
      "Falta configurar TIENDA_NEGOCIO_OAUTH_ORIGIN.",
      "API_CONFIGURATION_ERROR",
    );
  }

  try {
    const origin = new URL(value);
    if (origin.protocol !== "https:" || origin.pathname !== "/" || origin.search || origin.hash) {
      throw new Error("Invalid Tienda Negocio OAuth origin");
    }
    return origin.origin;
  } catch (cause: unknown) {
    throw new ApiError(
      "TIENDA_NEGOCIO_OAUTH_ORIGIN debe ser un origen HTTPS válido.",
      "API_CONFIGURATION_ERROR",
      { cause },
    );
  }
}

export function logTiendaNegocioOAuthError(
  stage: "connect" | "callback",
  operation: string,
  error: unknown,
): void {
  const details = error instanceof ApiError
    ? { operation, code: error.code, status: error.status }
    : { operation, name: error instanceof Error ? error.name : "UnknownError" };
  console.error(`[tienda-negocio-oauth] ${stage} failed`, details);
}
