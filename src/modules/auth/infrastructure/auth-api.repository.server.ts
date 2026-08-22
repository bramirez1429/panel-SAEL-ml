import "server-only";

import { ApiError } from "@/shared/api/api-error";
import type {
  HttpGetClient,
  HttpPostClient,
} from "@/shared/api/http-client.server";

import type {
  AuthSession,
  LoginCredentials,
  User,
} from "../domain/auth.model";
import type { AuthRepository } from "../domain/auth.repository";
import { mapLoginResponse } from "./login-response.mapper";
import { loginResponseSchema } from "./login-response.schema";
import { mapSafeUser } from "./safe-user.mapper";
import { safeUserSchema } from "./safe-user.schema";

const LOGIN_ENDPOINT = "/auth/login";
const CURRENT_USER_ENDPOINT = "/auth/me";
const LOGOUT_ENDPOINT = "/auth/logout";

type AuthHttpClient = HttpGetClient & HttpPostClient;

/**
 * Implementación HTTP del contrato AuthRepository. Es la única capa del
 * módulo que conoce el endpoint y el DTO de autenticación de NestJS.
 */
export class AuthApiRepository implements AuthRepository {
  constructor(private readonly httpClient: AuthHttpClient) {}

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const response = await this.httpClient.post(LOGIN_ENDPOINT, credentials);
    const validation = loginResponseSchema.safeParse(response);

    if (!validation.success) {
      throw new ApiError(
        "El backend devolvió una respuesta de autenticación inválida.",
        "API_INVALID_RESPONSE",
        { cause: validation.error },
      );
    }

    return mapLoginResponse(validation.data);
  }

  async getCurrentUser(accessToken: string): Promise<User> {
    const response = await this.httpClient.get(CURRENT_USER_ENDPOINT, {
      bearerToken: accessToken,
    });
    const validation = safeUserSchema.safeParse(response);

    if (!validation.success) {
      throw new ApiError(
        "El backend devolvió un usuario autenticado inválido.",
        "API_INVALID_RESPONSE",
        { cause: validation.error },
      );
    }

    return mapSafeUser(validation.data);
  }

  async logout(accessToken: string): Promise<void> {
    await this.httpClient.post(LOGOUT_ENDPOINT, undefined, {
      bearerToken: accessToken,
    });
  }
}
