import type { SyncActionResult, SyncJob } from "../domain/sync.model";

type ErrorResponse = Readonly<{ message?: unknown }>;

export async function fetchSyncStatus(
  syncId: string,
  signal?: AbortSignal,
): Promise<SyncActionResult<SyncJob>> {
  try {
    const response = await fetch(`/api/sync/status/${encodeURIComponent(syncId)}`, {
      cache: "no-store",
      method: "GET",
      signal,
    });
    const body: unknown = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        message: getErrorMessage(body),
      };
    }

    return { ok: true, data: body as SyncJob };
  } catch (error: unknown) {
    return {
      ok: false,
      message: error instanceof DOMException && error.name === "AbortError"
        ? "La consulta de sincronización fue cancelada."
        : "No se pudo consultar el estado de la sincronización.",
    };
  }
}

function getErrorMessage(body: unknown): string {
  const message = typeof body === "object" && body !== null
    ? (body as ErrorResponse).message
    : undefined;

  if (
    typeof message === "string" &&
    message.trim()
  ) {
    return message.trim();
  }

  return "No se pudo consultar el estado de la sincronización.";
}
