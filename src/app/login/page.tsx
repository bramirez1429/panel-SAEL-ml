import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createGetCurrentUserQuery } from "@/modules/auth/auth.composition.server";
import { getSessionTokens } from "@/modules/auth/infrastructure/session/auth-session.server";
import { LoginView } from "@/modules/auth/presentation/login-view";
import { ApiError } from "@/shared/api/api-error";

import { loginAction } from "./login.action";

export const metadata: Metadata = {
  title: "Iniciar sesión | Panel",
};

/** La ruta permanece server-side para consultar las cookies HttpOnly. */
export default async function LoginPage() {
  const tokens = await getSessionTokens();
  let hasValidSession = false;

  if (tokens) {
    try {
      await createGetCurrentUserQuery().execute(tokens.accessToken);
      hasValidSession = true;
    } catch (error: unknown) {
      // Una cookie no autentica por sí sola; ante rechazo o indisponibilidad se ofrece login.
      if (error instanceof ApiError) {
        hasValidSession = false;
      } else {
        throw error;
      }
    }
  }

  if (hasValidSession) {
    redirect("/dashboard");
  }

  return <LoginView action={loginAction} />;
}
