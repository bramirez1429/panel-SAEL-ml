import { AppError } from "@/shared/errors/app-error";

export type ApiErrorCode =
  | "API_CONFIGURATION_ERROR"
  | "API_TIMEOUT"
  | "API_UNREACHABLE"
  | "API_HTTP_ERROR"
  | "API_INVALID_RESPONSE";

type ApiErrorOptions = ErrorOptions &
  Readonly<{
    status?: number;
    responseBody?: unknown;
  }>;

export class ApiError extends AppError<ApiErrorCode> {
  readonly status?: number;
  readonly responseBody?: unknown;

  constructor(
    message: string,
    code: ApiErrorCode,
    options?: ApiErrorOptions,
  ) {
    super(message, code, options);

    this.name = "ApiError";
    this.status = options?.status;
    this.responseBody = options?.responseBody;
  }
}
