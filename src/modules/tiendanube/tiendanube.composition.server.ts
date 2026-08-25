import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";
import { GetTiendanubeReplicationStatusQuery } from "./application/get-tiendanube-replication-status.query";
import { ReplicatePublicationCommand } from "./application/replicate-publication.command";
import { TiendanubeReplicationApiRepository } from "./infrastructure/tiendanube-replication-api.repository.server";

function createRepository(): TiendanubeReplicationApiRepository {
  return new TiendanubeReplicationApiRepository(
    createAuthenticatedHttpClient(new HttpClient(getApiConfig())),
  );
}

export function createGetTiendanubeReplicationStatusQuery(): GetTiendanubeReplicationStatusQuery {
  return new GetTiendanubeReplicationStatusQuery(createRepository());
}

export function createReplicatePublicationCommand(): ReplicatePublicationCommand {
  return new ReplicatePublicationCommand(createRepository());
}
