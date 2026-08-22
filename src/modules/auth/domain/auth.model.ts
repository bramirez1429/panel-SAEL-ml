/**
 * Valores seguros que cruzan el caso de uso de login. El dominio no conserva
 * password hashes ni detalles del transporte HTTP de NestJS.
 */
export type LoginCredentials = Readonly<{
  email: string;
  password: string;
}>;

export type User = Readonly<{
  id: string;
  email: string;
  name: string | null;
}>;

export type AuthTokens = Readonly<{
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}>;

export type AuthSession = Readonly<{
  user: User;
  tokens: AuthTokens;
}>;
