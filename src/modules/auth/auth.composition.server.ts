import "server-only";

import { getApiConfig } from "@/shared/api/api-config";
import { HttpClient } from "@/shared/api/http-client.server";

import { GetCurrentUserQuery } from "./application/get-current-user.query";
import { LoginUser } from "./application/login-user";
import { LogoutUser } from "./application/logout-user";
import type { AuthRepository } from "./domain/auth.repository";
import { AuthApiRepository } from "./infrastructure/auth-api.repository.server";

/**
 * Punto de composición server-only: conecta el caso de uso con HTTP sin
 * introducir un contenedor de dependencias ni exponer configuración al cliente.
 */
export function createLoginUser(): LoginUser {
  return new LoginUser(createAuthRepository());
}

export function createGetCurrentUserQuery(): GetCurrentUserQuery {
  return new GetCurrentUserQuery(createAuthRepository());
}

export function createLogoutUser(): LogoutUser {
  return new LogoutUser(createAuthRepository());
}

function createAuthRepository(): AuthRepository {
  const httpClient = new HttpClient(getApiConfig());

  return new AuthApiRepository(httpClient);
}
