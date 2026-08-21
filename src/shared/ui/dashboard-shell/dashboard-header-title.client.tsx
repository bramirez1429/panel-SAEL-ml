"use client";

import { usePathname } from "next/navigation";

import { findDashboardSection } from "./dashboard-sections";
import styles from "./dashboard-shell.module.css";

export function DashboardHeaderTitle() {
  const pathname = usePathname();
  const title = findDashboardSection(pathname)?.title ?? "Panel";

  return (
    <h1 aria-atomic="true" aria-live="polite" className={styles.headerTitle}>
      {title}
    </h1>
  );
}
