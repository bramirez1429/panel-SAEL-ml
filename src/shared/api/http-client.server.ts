import "server-only";

import { getApiConfig, type ApiConfig } from "./api-config";
import { ApiError } from "./api-error";

export type HttpGetClient = Pick<HttpClient, "get">;

// This boundary stays server-only so backend configuration never reaches browser bundles.
// Centralizing fetch also gives every repository the same timeout and error semantics.
export class HttpClient {
  constructor(
    private readonly config: ApiConfig = getApiConfig(),
    private readonly fetchImplementation: typeof fetch = globalThis.fetch,
  ) {}

  async get(path: string): Promise<unknown> {
    try {
      const response = await this.fetchImplementation(
        resolveApiUrl(this.config.baseUrl, path),
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json, text/plain;q=0.9",
          },
          signal: AbortSignal.timeout(this.config.timeoutMs),
        },
      );

      if (!response.ok) {
        throw new ApiError(
          `El backend respondió con HTTP ${response.status}.`,
          "API_HTTP_ERROR",
          { status: response.status },
        );
      }

      return await readResponseBody(response);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (isTimeoutError(error)) {
        throw new ApiError(
          "La solicitud al backend superó el tiempo límite.",
          "API_TIMEOUT",
          { cause: error },
        );
      }

      throw new ApiError(
        "No se pudo conectar con el backend.",
        "API_UNREACHABLE",
        { cause: error },
      );
    }
  }
}

function resolveApiUrl(baseUrl: string, path: string): URL {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new ApiError(
      "La ruta del backend debe ser relativa al origen configurado.",
      "API_CONFIGURATION_ERROR",
    );
  }

  return new URL(path, `${baseUrl}/`);
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const isJson =
    contentType.includes("application/json") || contentType.includes("+json");

  try {
    return isJson ? await response.json() : await response.text();
  } catch (cause: unknown) {
    throw new ApiError(
      "El backend devolvió un cuerpo de respuesta inválido.",
      "API_INVALID_RESPONSE",
      { cause, status: response.status },
    );
  }
}

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}
