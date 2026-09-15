import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { createAuthenticatedHttpClient } from "@/shared/api/authenticated-http-client.server";
import { HttpClient } from "@/shared/api/http-client.server";

import { UsersApiRepository } from "./infrastructure/users-api.repository.server";

export function createUsersRepository() {
  return new UsersApiRepository(
    createAuthenticatedHttpClient(
      new HttpClient(getApiConfig()),
    ),
  );
}

