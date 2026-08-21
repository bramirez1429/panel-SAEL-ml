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
}>;

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

export function DashboardShell({ children }: DashboardShellProps) {
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
        <DashboardMobileNavigation />
      </header>

      <div className={styles.content}>
        <PageContainer className={styles.main}>{children}</PageContainer>
      </div>
    </div>
  );
}
