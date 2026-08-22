"use server";

import { redirect } from "next/navigation";

import { createLogoutUser } from "@/modules/auth/auth.composition.server";
import {
  deleteSession,
  getAccessToken,
} from "@/modules/auth/infrastructure/session/auth-session.server";

/**
 * Compone la revocación remota con la sesión HttpOnly de Next.js. La
 * limpieza local se garantiza aunque el token haya vencido o NestJS no responda.
 */
export async function logoutAction(): Promise<never> {
  const accessToken = await getAccessToken();

  try {
    if (accessToken) {
      await createLogoutUser().execute(accessToken);
    }
  } finally {
    await deleteSession();
    redirect("/login");
  }
}
