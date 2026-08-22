import type { ReactNode } from "react";

import { DashboardShell } from "@/shared/ui/dashboard-shell/dashboard-shell";

import { logoutAction } from "./logout.action";

type DashboardLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardShell logoutAction={logoutAction}>{children}</DashboardShell>
  );
}
