"use client";

import { useState } from "react";
import { Button, Drawer, Menu } from "antd";
import type { MenuProps } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  dashboardSections,
  findDashboardSection,
} from "./dashboard-sections";
import styles from "./dashboard-shell.module.css";

const menuItems: MenuProps["items"] = dashboardSections.map(({ href, title }) => ({
  key: href,
  label: <Link href={href}>{title}</Link>,
}));

type NavigationMenuProps = Readonly<{
  onNavigate?: () => void;
}>;

function NavigationMenu({ onNavigate }: NavigationMenuProps) {
  const pathname = usePathname();
  const activeSection = findDashboardSection(pathname);

  return (
    <Menu
      className={styles.navigationMenu}
      items={menuItems}
      mode="inline"
      onClick={onNavigate}
      selectedKeys={activeSection ? [activeSection.href] : []}
    />
  );
}

export function DashboardDesktopNavigation() {
  return (
    <nav className={styles.desktopNavigation} aria-label="Navegación principal">
      <NavigationMenu />
    </nav>
  );
}

type DashboardMobileNavigationProps = Readonly<{
  logoutAction: () => Promise<void>;
}>;

export function DashboardMobileNavigation({
  logoutAction,
}: DashboardMobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const closeNavigation = () => setIsOpen(false);

  return (
    <div className={styles.mobileNavigation}>
      <Button
        aria-expanded={isOpen}
        aria-label="Abrir navegación"
        onClick={() => setIsOpen(true)}
        size="large"
        type="text"
      >
        Menú
      </Button>

      <Drawer
        onClose={closeNavigation}
        open={isOpen}
        placement="right"
        size="min(320px, 100vw)"
        title={
          <Link href="/dashboard" onClick={closeNavigation}>
            Panel
          </Link>
        }
      >
        <nav aria-label="Navegación principal móvil">
          <NavigationMenu onNavigate={closeNavigation} />
        </nav>
        <form action={logoutAction} className={styles.mobileLogout}>
          <Button block danger htmlType="submit">
            Cerrar sesión
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
