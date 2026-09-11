import { z } from "zod";

/** Contrato de rotación de la sesión propia del Panel. */
export const refreshResponseSchema = z.object({
  accessToken: z.string().min(1),
  accessTokenExpiresAt: z.iso.datetime(),
  refreshToken: z.string().min(1),
  refreshTokenExpiresAt: z.iso.datetime(),
}).readonly();
