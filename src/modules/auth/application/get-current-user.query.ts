import type { User } from "../domain/auth.model";
import type { AuthRepository } from "../domain/auth.repository";

/**
 * Verifica el access token con la autoridad NestJS. La presencia de una
 * cookie por sí sola no se considera una sesión válida.
 */
export class GetCurrentUserQuery {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(accessToken: string): Promise<User> {
    return this.authRepository.getCurrentUser(accessToken);
  }
}
