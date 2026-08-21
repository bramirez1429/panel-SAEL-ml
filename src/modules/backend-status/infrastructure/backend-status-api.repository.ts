import { ApiError } from "@/shared/api/api-error";
import type { HttpGetClient } from "@/shared/api/http-client.server";

import type { BackendStatus } from "../domain/backend-status.model";
import type { BackendStatusRepository } from "../domain/backend-status.repository";
import { backendStatusResponseSchema } from "./backend-status.schema";

export class BackendStatusApiRepository implements BackendStatusRepository {
  constructor(private readonly httpClient: HttpGetClient) {}

  async getStatus(): Promise<BackendStatus> {
    const response = await this.httpClient.get("/");
    const validation = backendStatusResponseSchema.safeParse(response);

    if (!validation.success) {
      throw new ApiError(
        "El backend devolvió una respuesta inválida.",
        "API_INVALID_RESPONSE",
        { cause: validation.error },
      );
    }

    return { state: "available" };
  }
}
