import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";
import { GetReplicablePublicationsQuery } from "./application/get-replicable-publications.query";
import { GetReplicationPreviewQuery } from "./application/get-replication-preview.query";
import { ReplicationApiRepository } from "./infrastructure/replication-api.repository.server";

function createRepository() {
  return new ReplicationApiRepository(
    createAuthenticatedHttpClient(new HttpClient(getApiConfig())),
  );
}

export function createGetReplicablePublicationsQuery() {
  return new GetReplicablePublicationsQuery(createRepository());
}

export function createGetReplicationPreviewQuery() {
  return new GetReplicationPreviewQuery(createRepository());
}
