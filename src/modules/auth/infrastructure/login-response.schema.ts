import { z } from "zod";

import { safeUserSchema } from "./safe-user.schema";

/** Valida la frontera externa antes de que los tokens entren al dominio. */
export const loginResponseSchema = z
  .object({
    accessToken: z.string().min(1),
    accessTokenExpiresAt: z.iso.datetime(),
    refreshToken: z.string().min(1),
    refreshTokenExpiresAt: z.iso.datetime(),
    user: safeUserSchema,
  })
  .readonly();

export type LoginResponseDto = z.infer<typeof loginResponseSchema>;
