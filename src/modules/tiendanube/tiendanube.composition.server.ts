import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";
import { GetTiendanubeReplicationStatusQuery } from "./application/get-tiendanube-replication-status.query";
import { GetTiendanubeProductByMlQuery } from "./application/get-tiendanube-product-by-ml.query";
import { GetTiendanubeProductsQuery } from "./application/get-tiendanube-products.query";
import { ReplicatePublicationCommand } from "./application/replicate-publication.command";
import { TiendanubeReplicationApiRepository } from "./infrastructure/tiendanube-replication-api.repository.server";
import { TiendanubeProductsApiRepository } from "./infrastructure/tiendanube-products-api.repository.server";

function createRepository(): TiendanubeReplicationApiRepository {
  return new TiendanubeReplicationApiRepository(
    createAuthenticatedHttpClient(new HttpClient(getApiConfig())),
  );
}

function createProductsRepository(): TiendanubeProductsApiRepository {
  return new TiendanubeProductsApiRepository(
    createAuthenticatedHttpClient(new HttpClient(getApiConfig())),
  );
}

export function createGetTiendanubeReplicationStatusQuery(): GetTiendanubeReplicationStatusQuery {
  return new GetTiendanubeReplicationStatusQuery(createRepository());
}

export function createGetTiendanubeProductByMlQuery(): GetTiendanubeProductByMlQuery {
  return new GetTiendanubeProductByMlQuery(createRepository());
}

export function createGetTiendanubeProductsQuery(): GetTiendanubeProductsQuery {
  return new GetTiendanubeProductsQuery(createProductsRepository());
}

export function createReplicatePublicationCommand(): ReplicatePublicationCommand {
  return new ReplicatePublicationCommand(createRepository());
}

export async function getTiendanubeCategories() {
  return createRepository().getCategories();
}
