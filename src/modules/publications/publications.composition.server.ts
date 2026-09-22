import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";

import { GetPublicationByIdQuery } from "./application/get-publication-by-id.query";
import { GetPublicationVariantsQuery } from "./application/get-publication-variants.query";
import { GetPublicationsQuery } from "./application/get-publications.query";
import { PublicationsApiRepository } from "./infrastructure/publications-api.repository.server";
import { PublicationEditApiRepository } from "./infrastructure/publication-edit-api.repository.server";
import { UpdatePublicationCommand } from "./application/update-publication.command";
import { CreateSimilarPublicationCommand } from "./application/create-similar-publication.command";
import { GetSimilarPublicationDraftQuery } from "./application/get-similar-publication-draft.query";
import { UploadSimilarPublicationPictureCommand } from "./application/upload-similar-publication-picture.command";
import { SimilarPublicationApiRepository } from "./infrastructure/similar-publication-api.repository.server";
import { createPromotionsRepository } from "@/modules/promotions/promotions.composition.server";
import { searchPublicationsByFamily } from "@/modules/promotions/application/search-publications-by-family";
import { BulkStockApiRepository } from "./bulk-stock/infrastructure/bulk-stock-api.repository.server";

/**
 * Punto de composición server-only: conecta el caso de uso con infraestructura
 * sin introducir un contenedor de dependencias ni filtrar configuración al cliente.
 */
export function createGetPublicationsQuery(): GetPublicationsQuery {
  const httpClient = createAuthenticatedHttpClient(
    new HttpClient(getApiConfig()),
  );
  const repository = new PublicationsApiRepository(httpClient);

  return new GetPublicationsQuery(repository, async (familyId) => {
    const page = await searchPublicationsByFamily(
      createPromotionsRepository(),
      familyId,
      { limit: 20, cursor: null },
    );
    return page.publications;
  });
}

export function createGetPublicationByIdQuery(): GetPublicationByIdQuery {
  const httpClient = createAuthenticatedHttpClient(
    new HttpClient(getApiConfig()),
  );
  const repository = new PublicationsApiRepository(httpClient);

  return new GetPublicationByIdQuery(repository);
}

export function createGetPublicationVariantsQuery(): GetPublicationVariantsQuery {
  const httpClient = createAuthenticatedHttpClient(
    new HttpClient(getApiConfig()),
  );
  return new GetPublicationVariantsQuery(
    new PublicationsApiRepository(httpClient),
  );
}

export function createUpdatePublicationCommand(): UpdatePublicationCommand {
  const httpClient = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
  return new UpdatePublicationCommand(new PublicationEditApiRepository(httpClient));
}

function createSimilarPublicationRepository(): SimilarPublicationApiRepository {
  const httpClient = new HttpClient(getApiConfig());
  const authenticated = createAuthenticatedHttpClient(httpClient);
  return new SimilarPublicationApiRepository({
    get: authenticated.get,
    post: authenticated.post,
  });
}

export function createGetSimilarPublicationDraftQuery(): GetSimilarPublicationDraftQuery {
  return new GetSimilarPublicationDraftQuery(createSimilarPublicationRepository());
}

export function createCreateSimilarPublicationCommand(): CreateSimilarPublicationCommand {
  return new CreateSimilarPublicationCommand(createSimilarPublicationRepository());
}

export function createUploadSimilarPublicationPictureCommand(): UploadSimilarPublicationPictureCommand {
  return new UploadSimilarPublicationPictureCommand(createSimilarPublicationRepository());
}

export function createBulkStockRepository(): BulkStockApiRepository {
  const httpClient = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
  return new BulkStockApiRepository({
    get: httpClient.get,
    post: httpClient.post,
  });
}
