import { z } from "zod";

/**
 * Valida el formulario en ambos lados de la frontera de la Server Action.
 * El backend sigue siendo la unica autoridad que acepta las credenciales.
 */
export const loginInputSchema = z.object({
  email: z
    .string({ error: "Ingresá tu email." })
    .trim()
    .min(1, "Ingresá tu email.")
    .max(254, "El email es demasiado largo.")
    .pipe(z.email("Ingresá un email válido."))
    .transform((email) => email.toLowerCase()),
  password: z
    .string({ error: "Ingresá tu contraseña." })
    .min(1, "Ingresá tu contraseña.")
    .max(128, "La contraseña es demasiado larga."),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export type LoginFieldErrors = Readonly<{
  email?: string;
  password?: string;
}>;

export function getLoginFieldErrors(
  error: z.ZodError<LoginInput>,
): LoginFieldErrors {
  const fields = z.flattenError(error).fieldErrors;

  return {
    email: fields.email?.[0],
    password: fields.password?.[0],
  };
}
