import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";
import { PublicationEditApiRepository } from "@/modules/publications/infrastructure/publication-edit-api.repository.server";

import { PublicationWorkspaceApiRepository } from "./infrastructure/publication-workspace-api.repository.server";

export function createPublicationWorkspaceRepository() {
  const client = createAuthenticatedHttpClient(new HttpClient(getApiConfig()));
  const editRepository = new PublicationEditApiRepository(client);
  return new PublicationWorkspaceApiRepository(
    client,
    (target) => editRepository.getSku(target),
  );
}
