import type { AuthRepository } from "../domain/auth.repository";

/**
 * Revoca en NestJS la sesión asociada al access token. No conoce cookies,
 * HTTP ni la redirección que corresponden al punto de entrada de Next.js.
 */
export class LogoutUser {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(accessToken: string): Promise<void> {
    return this.authRepository.logout(accessToken);
  }
}
