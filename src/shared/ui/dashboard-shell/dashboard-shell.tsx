import type { ReactNode } from "react";
import Link from "next/link";

import { PageContainer } from "@/shared/ui/page-container/page-container";

import {
  DashboardDesktopNavigation,
  DashboardMobileNavigation,
} from "./dashboard-navigation.client";
import { DashboardHeaderTitle } from "./dashboard-header-title.client";
import styles from "./dashboard-shell.module.css";

type DashboardShellProps = Readonly<{
  children: ReactNode;
  logoutAction: () => Promise<void>;
  currentUser?: Readonly<{ name: string | null; email: string }> | null;
}>;

export function getCurrentUserLabel(user: Readonly<{ name: string | null; email: string }>): string {
  return user.name?.trim() || user.email;
}

export function getCurrentUserInitial(user: Readonly<{ name: string | null; email: string }>): string {
  return Array.from(getCurrentUserLabel(user))[0]?.toLocaleUpperCase("es") ?? "?";
}

function Brand() {
  return (
    <>
      <span className={styles.brandMark} aria-hidden="true">
        P
      </span>
      <span className={styles.brandName}>Panel</span>
    </>
  );
}

export function DashboardShell({ children, logoutAction, currentUser }: DashboardShellProps) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link
          className={styles.brand}
          href="/dashboard"
          aria-label="Ir al dashboard"
        >
          <Brand />
        </Link>
        <DashboardDesktopNavigation />
        <form action={logoutAction} className={styles.desktopLogout}>
          <button className={styles.logoutButton} type="submit">
            Cerrar sesión
          </button>
        </form>
      </aside>

      <header className={styles.header}>
        <Link
          className={styles.mobileBrand}
          href="/dashboard"
          aria-label="Ir al dashboard"
        >
          <Brand />
        </Link>
        <DashboardHeaderTitle />
        {currentUser ? (
          <div className={styles.currentUser} aria-label={`Usuario autenticado: ${getCurrentUserLabel(currentUser)}`}>
            <span className={styles.currentUserAvatar} aria-hidden="true">{getCurrentUserInitial(currentUser)}</span>
            <span className={styles.currentUserName}>{getCurrentUserLabel(currentUser)}</span>
          </div>
        ) : null}
        <DashboardMobileNavigation logoutAction={logoutAction} />
      </header>

      <div className={styles.content}>
        <PageContainer className={styles.main}>{children}</PageContainer>
      </div>
    </div>
  );
}
