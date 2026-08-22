import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { HttpClient } from "@/shared/api/http-client.server";

import { GetCurrentUserQuery } from "./application/get-current-user.query";
import { LoginUser } from "./application/login-user";
import { AuthApiRepository } from "./infrastructure/auth-api.repository.server";

/**
 * Punto de composición server-only: conecta el caso de uso con HTTP sin
 * introducir un contenedor de dependencias ni exponer configuración al cliente.
 */
export function createLoginUser(): LoginUser {
  const httpClient = new HttpClient(getApiConfig());
  const repository = new AuthApiRepository(httpClient);

  return new LoginUser(repository);
}

export function createGetCurrentUserQuery(): GetCurrentUserQuery {
  const httpClient = new HttpClient(getApiConfig());
  const repository = new AuthApiRepository(httpClient);

  return new GetCurrentUserQuery(repository);
}
