import { ApiError } from "@/shared/api/api-error";

const INVALID_CREDENTIALS_MESSAGE = "Email o contraseña incorrectos.";
const UNREACHABLE_MESSAGE =
  "No pudimos conectarnos con el servicio de autenticación. Intentá nuevamente.";
const TIMEOUT_MESSAGE =
  "El servicio de autenticación tardó demasiado en responder. Intentá nuevamente.";
const INVALID_RESPONSE_MESSAGE =
  "El servicio de autenticación devolvió una respuesta inválida. Intentá nuevamente.";
const UNEXPECTED_MESSAGE = "No pudimos iniciar sesión. Intentá nuevamente.";

/** Traduce errores controlados a mensajes seguros, sin filtrar detalles internos. */
export function getLoginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return UNEXPECTED_MESSAGE;
  }

  if (error.code === "API_HTTP_ERROR" && error.status === 401) {
    return INVALID_CREDENTIALS_MESSAGE;
  }

  if (error.code === "API_UNREACHABLE") {
    return UNREACHABLE_MESSAGE;
  }

  if (error.code === "API_TIMEOUT") {
    return TIMEOUT_MESSAGE;
  }

  if (error.code === "API_INVALID_RESPONSE") {
    return INVALID_RESPONSE_MESSAGE;
  }

  return UNEXPECTED_MESSAGE;
}
