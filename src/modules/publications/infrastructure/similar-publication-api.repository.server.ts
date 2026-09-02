import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type { AuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { AppError } from "@/shared/errors/app-error";
import type { SimilarPublicationCreateInput } from "../domain/similar-publication.model";
import type { SimilarPublicationRepository } from "../domain/similar-publication.repository";
import {
  similarPublicationCreationSchema,
  similarPublicationDraftSchema,
  similarPublicationPictureSchema,
} from "./similar-publication-response.schema";

const BASE_PATH = "/mercadolibre/direct/publicar-similar";
const WRITE_TIMEOUT_MS = 120_000;
const MAX_BASE64_PICTURE_SIZE = 3 * 1024 * 1024;
const ALLOWED_PICTURE_MIME_TYPES = new Set(["image/jpeg", "image/png"]);

type SimilarPublicationHttpClient = Pick<AuthenticatedHttpClient, "get" | "post">;

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
    validatePicture(file);
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const parsed = similarPublicationPictureSchema.safeParse(
      await this.httpClient.post(
        `${BASE_PATH}/pictures/base64`,
        {
          fileName: file.name,
          mimeType: file.type,
          base64,
        },
        { timeoutMs: WRITE_TIMEOUT_MS },
      ),
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

function validatePicture(file: File): void {
  if (!ALLOWED_PICTURE_MIME_TYPES.has(file.type.toLowerCase())) {
    throw new AppError(
      "La imagen debe ser JPG, JPEG o PNG.",
      "SIMILAR_PUBLICATION_PICTURE_INVALID_TYPE",
    );
  }
  if (file.size <= 0 || file.size > MAX_BASE64_PICTURE_SIZE) {
    throw new AppError(
      "La imagen debe pesar como máximo 3 MB.",
      "SIMILAR_PUBLICATION_PICTURE_INVALID_SIZE",
    );
  }
}

function invalidResponse(label: string, cause: unknown): ApiError {
  return new ApiError(
    `El backend devolvió un ${label} de publicación similar inválido.`,
    "API_INVALID_RESPONSE",
    { cause },
  );
}
