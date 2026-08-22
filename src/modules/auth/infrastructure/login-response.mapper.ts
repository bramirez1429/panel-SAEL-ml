import type { AuthSession } from "../domain/auth.model";
import type { LoginResponseDto } from "./login-response.schema";
import { mapSafeUser } from "./safe-user.mapper";

/** Convierte el DTO validado de NestJS al modelo propio del módulo Auth. */
export function mapLoginResponse(dto: LoginResponseDto): AuthSession {
  return {
    user: mapSafeUser(dto.user),
    tokens: {
      accessToken: dto.accessToken,
      accessTokenExpiresAt: new Date(dto.accessTokenExpiresAt),
      refreshToken: dto.refreshToken,
      refreshTokenExpiresAt: new Date(dto.refreshTokenExpiresAt),
    },
  };
}
