import type { ReactNode } from "react";

import { DashboardShell } from "@/shared/ui/dashboard-shell/dashboard-shell";
import { createGetCurrentUserQuery } from "@/modules/auth/auth.composition.server";
import { getAccessToken } from "@/modules/auth/infrastructure/session/auth-session.server";
import { AppError } from "@/shared/errors/app-error";

import { logoutAction } from "./logout.action";

type DashboardLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const currentUser = await loadCurrentUser();

  return (
    <DashboardShell logoutAction={logoutAction} currentUser={currentUser}>{children}</DashboardShell>
  );
}

async function loadCurrentUser(): Promise<Readonly<{ name: string | null; email: string }> | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  try {
    const user = await createGetCurrentUserQuery().execute(accessToken);
    return { name: user.name, email: user.email };
  } catch (error: unknown) {
    if (error instanceof AppError) return null;
    throw error;
  }
}
