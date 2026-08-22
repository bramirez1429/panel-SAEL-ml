import type { AuthSession, LoginCredentials } from "../domain/auth.model";
import type { AuthRepository } from "../domain/auth.repository";

/**
 * Caso de uso responsable de autenticar al usuario.
 * Depende del contrato AuthRepository y no conoce HTTP, cookies ni Next.js.
 */
export class LoginUser {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(credentials: LoginCredentials): Promise<AuthSession> {
    return this.authRepository.login(credentials);
  }
}
