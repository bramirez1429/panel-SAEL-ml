"use server";

import { redirect } from "next/navigation";

import { createLoginUser } from "@/modules/auth/auth.composition.server";
import { createSession } from "@/modules/auth/infrastructure/session/auth-session.server";
import type { LoginActionState } from "@/modules/auth/presentation/login-action-state";
import { getLoginErrorMessage } from "@/modules/auth/presentation/login-error-message";
import {
  getLoginFieldErrors,
  loginInputSchema,
} from "@/modules/auth/presentation/login-input.schema";

/**
 * Punto de composición del login: conecta la entrada web con application y la
 * sesión server-only sin introducir dependencias de infraestructura en presentation.
 */
export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const validation = loginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validation.success) {
    return { fieldErrors: getLoginFieldErrors(validation.error) };
  }

  try {
    const session = await createLoginUser().execute(validation.data);
    await createSession(session.tokens);
  } catch (error: unknown) {
    return { formError: getLoginErrorMessage(error) };
  }

  // redirect lanza la señal de control de Next y debe quedar fuera del catch.
  redirect("/dashboard");
}
