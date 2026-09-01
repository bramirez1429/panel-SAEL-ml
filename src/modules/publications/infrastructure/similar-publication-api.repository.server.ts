import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import type { AuthenticatedMultipartHttpClient } from "@/shared/api/authenticated-multipart-http-client.server";
import type { SimilarPublicationCreateInput } from "../domain/similar-publication.model";
import type { SimilarPublicationRepository } from "../domain/similar-publication.repository";
import {
  similarPublicationCreationSchema,
  similarPublicationDraftSchema,
  similarPublicationPictureSchema,
} from "./similar-publication-response.schema";

const BASE_PATH = "/mercadolibre/direct/publicar-similar";
const WRITE_TIMEOUT_MS = 120_000;

type SimilarPublicationHttpClient = Pick<AuthenticatedHttpClient, "get" | "post"> &
  AuthenticatedMultipartHttpClient;

export class SimilarPublicationApiRepository implements SimilarPublicationRepository {
  constructor(private readonly httpClient: SimilarPublicationHttpClient) {}

  async getDraft(sourceKey: string) {
    const query = new URLSearchParams({ sourceKey });
    const parsed = similarPublicationDraftSchema.safeParse(
      await this.httpClient.get(`${BASE_PATH}/draft?${query.toString()}`),
    );
    if (!parsed.success) throw invalidResponse("borrador", parsed.error);
    return parsed.data;
  }

  async uploadPicture(file: File) {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const parsed = similarPublicationPictureSchema.safeParse(
      await this.httpClient.postMultipart(`${BASE_PATH}/pictures`, formData, {
        timeoutMs: WRITE_TIMEOUT_MS,
      }),
    );
    if (!parsed.success) throw invalidResponse("imagen", parsed.error);
    return parsed.data;
  }

  async create(input: SimilarPublicationCreateInput) {
    const parsed = similarPublicationCreationSchema.safeParse(
      await this.httpClient.post(BASE_PATH, input, { timeoutMs: WRITE_TIMEOUT_MS }),
    );
    if (!parsed.success) throw invalidResponse("resultado", parsed.error);
    return {
      status: parsed.data.status,
      items: parsed.data.items,
      newSourceKey: parsed.data.sourceKey,
    };
  }
}

function invalidResponse(label: string, cause: unknown): ApiError {
  return new ApiError(
    `El backend devolvió un ${label} de publicación similar inválido.`,
    "API_INVALID_RESPONSE",
    { cause },
  );
}
