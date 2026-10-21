import { AppError } from "@/shared/errors/app-error";
import { ApiError } from "./api-error";

export function isPanelAuthenticationFailure(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401 && hasPanelAuthenticationCode(error.responseBody);
  }
  return error instanceof AppError && error.code === "AUTHENTICATION_REQUIRED";
}

function hasPanelAuthenticationCode(responseBody: unknown): boolean {
  if (typeof responseBody !== "object" || responseBody === null) return false;
  const code = "code" in responseBody ? responseBody.code : undefined;
  return code === "AUTHENTICATION_REQUIRED";
}
