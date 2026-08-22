import { z } from "zod";

/** Forma segura de usuario compartida por login y consulta de sesión. */
export const safeUserSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  name: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type SafeUserDto = z.infer<typeof safeUserSchema>;
