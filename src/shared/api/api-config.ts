import "server-only";

import { ApiError } from "./api-error";

const DEFAULT_API_TIMEOUT_MS = 5_000;
const MAX_API_TIMEOUT_MS = 2_147_483_647;

type ApiEnvironment = Readonly<Record<string, string | undefined>>;

export interface ApiConfig {
  readonly baseUrl: string;
  readonly timeoutMs: number;
}

// Centralizing environment parsing keeps transport configuration out of routes and modules.
export function getApiConfig(
  environment: ApiEnvironment = process.env,
): ApiConfig {
  const baseUrl = parseBaseUrl(environment.BACKEND_API_URL);
  const timeoutMs = parseTimeout(environment.BACKEND_API_TIMEOUT_MS);

  return { baseUrl, timeoutMs };
}

function parseBaseUrl(value: string | undefined): string {
  const rawUrl = value?.trim();

  if (!rawUrl) {
    throw new ApiError(
      "Falta configurar BACKEND_API_URL.",
      "API_CONFIGURATION_ERROR",
    );
  }

  try {
    const url = new URL(rawUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported backend URL protocol");
    }

    if (url.search || url.hash) {
      throw new Error("Backend URL must not include a query or fragment");
    }

    return url.toString().replace(/\/$/, "");
  } catch (cause: unknown) {
    throw new ApiError(
      "BACKEND_API_URL debe ser una URL HTTP válida.",
      "API_CONFIGURATION_ERROR",
      { cause },
    );
  }
}

function parseTimeout(value: string | undefined): number {
  if (!value?.trim()) {
    return DEFAULT_API_TIMEOUT_MS;
  }

  const timeoutMs = Number(value);

  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs <= 0 ||
    timeoutMs > MAX_API_TIMEOUT_MS
  ) {
    throw new ApiError(
      "BACKEND_API_TIMEOUT_MS debe ser un entero positivo válido.",
      "API_CONFIGURATION_ERROR",
    );
  }

  return timeoutMs;
}
