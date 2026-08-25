import "server-only";

import { getApiConfig, type ApiConfig } from "./api-config";
import { ApiError } from "./api-error";

export type HttpGetClient = Pick<HttpClient, "get">;
export type HttpPostClient = Pick<HttpClient, "post">;
export type HttpPatchClient = Pick<HttpClient, "patch">;
export type HttpDeleteClient = Pick<HttpClient, "delete">;
export type HttpRequestOptions = Readonly<{
  bearerToken?: string;
  cookieHeader?: string;
}>;
export type HttpGetOptions = HttpRequestOptions;
export type HttpPostOptions = HttpRequestOptions;
export type HttpPatchOptions = HttpRequestOptions;
export type HttpDeleteOptions = HttpRequestOptions;
export type HttpResponse = Readonly<{
  body: unknown;
  headers: Headers;
}>;

// This boundary stays server-only so backend configuration never reaches browser bundles.
// Centralizing fetch also gives every repository the same timeout and error semantics.
export class HttpClient {
  constructor(
    private readonly config: ApiConfig = getApiConfig(),
    private readonly fetchImplementation: typeof fetch = globalThis.fetch,
  ) {}

  async get(path: string, options: HttpGetOptions = {}): Promise<unknown> {
    const response = await this.getResponse(path, options);
    return response.body;
  }

  async getResponse(
    path: string,
    options: HttpGetOptions = {},
  ): Promise<HttpResponse> {
    return this.request(path, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain;q=0.9",
        ...(options.bearerToken
          ? { Authorization: `Bearer ${options.bearerToken}` }
          : {}),
        ...(options.cookieHeader ? { Cookie: options.cookieHeader } : {}),
      },
    });
  }

  async post(
    path: string,
    body?: unknown,
    options: HttpPostOptions = {},
  ): Promise<unknown> {
    const response = await this.postResponse(path, body, options);
    return response.body;
  }

  async postResponse(
    path: string,
    body?: unknown,
    options: HttpPostOptions = {},
  ): Promise<HttpResponse> {
    const hasBody = body !== undefined;

    return this.request(path, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain;q=0.9",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(options.bearerToken
          ? { Authorization: `Bearer ${options.bearerToken}` }
          : {}),
        ...(options.cookieHeader ? { Cookie: options.cookieHeader } : {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  }

  async patch(path: string, body?: unknown, options: HttpPatchOptions = {}): Promise<unknown> {
    const response = await this.patchResponse(path, body, options);
    return response.body;
  }

  async patchResponse(
    path: string,
    body?: unknown,
    options: HttpPatchOptions = {},
  ): Promise<HttpResponse> {
    const hasBody = body !== undefined;
    return this.request(path, {
      method: "PATCH",
      headers: {
        Accept: "application/json, text/plain;q=0.9",
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(options.bearerToken ? { Authorization: `Bearer ${options.bearerToken}` } : {}),
        ...(options.cookieHeader ? { Cookie: options.cookieHeader } : {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  }

  async delete(path: string, options: HttpDeleteOptions = {}): Promise<unknown> {
    const response = await this.deleteResponse(path, options);
    return response.body;
  }

  async deleteResponse(path: string, options: HttpDeleteOptions = {}): Promise<HttpResponse> {
    return this.request(path, {
      method: "DELETE",
      headers: {
        Accept: "application/json, text/plain;q=0.9",
        ...(options.bearerToken ? { Authorization: `Bearer ${options.bearerToken}` } : {}),
        ...(options.cookieHeader ? { Cookie: options.cookieHeader } : {}),
      },
    });
  }

  private async request(path: string, init: RequestInit): Promise<HttpResponse> {
    try {
      const response = await this.fetchImplementation(
        resolveApiUrl(this.config.baseUrl, path),
        {
          ...init,
          cache: "no-store",
          signal: AbortSignal.timeout(this.config.timeoutMs),
        },
      );

      if (!response.ok) {
        const responseBody = await readResponseBody(response);
        throw new ApiError(
          extractHttpErrorMessage(response.status, responseBody),
          "API_HTTP_ERROR",
          { status: response.status, responseBody },
        );
      }

      return {
        body: await readResponseBody(response),
        headers: response.headers,
      };
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

function extractHttpErrorMessage(status: number, body: unknown): string {
  if (typeof body === "string" && body.trim()) return body.trim();
  if (isRecord(body)) {
    const message = body.message;
    if (typeof message === "string" && message.trim()) return message.trim();
    if (Array.isArray(message)) {
      const values = message.filter((item): item is string => typeof item === "string");
      if (values.length > 0) return values.join("; ");
    }
    if (typeof body.error === "string" && body.error.trim()) return body.error.trim();
  }
  return `El backend respondió con HTTP ${status}.`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
