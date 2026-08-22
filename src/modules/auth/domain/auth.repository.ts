import type { AuthSession, LoginCredentials, User } from "./auth.model";

/**
 * Puerto requerido por application para autenticar credenciales.
 * No conoce endpoints, cookies ni el formato externo de NestJS.
 */
export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  getCurrentUser(accessToken: string): Promise<User>;
}
