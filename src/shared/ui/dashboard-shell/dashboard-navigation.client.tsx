"use client";

import { useEffect, useState } from "react";
import { Button, Drawer, Menu } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, ShopOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { findDashboardSection } from "./dashboard-sections";
import {
  createDashboardNavigationEntries,
  getTiendanubeSubmenuTitle,
  isTiendanubePath,
  TIENDANUBE_GROUP_KEY,
} from "./dashboard-navigation.model";
import styles from "./dashboard-shell.module.css";

const menuItems: MenuProps["items"] = createDashboardNavigationEntries().map((entry) => {
  if (entry.kind === "group") {
    return {
      key: entry.key,
      label: entry.title,
      title: entry.title,
      icon: <ShopOutlined />,
      children: entry.sections.map((section) => ({
        key: section.href,
        label: <Link href={section.href}>{getTiendanubeSubmenuTitle(section)}</Link>,
        title: getTiendanubeSubmenuTitle(section),
      })),
    };
  }

  const { section } = entry;
  return {
    key: section.href,
    label: <Link href={section.href}>{section.title}</Link>,
    icon: section.icon,
    title: section.title,
  };
});

type NavigationMenuProps = Readonly<{
  onNavigate?: () => void;
  collapsed?: boolean;
}>;

function NavigationMenu({ onNavigate, collapsed = false }: NavigationMenuProps) {
  const pathname = usePathname();
  const activeSection = findDashboardSection(pathname);
  const [openKeys, setOpenKeys] = useState<string[]>(() =>
    isTiendanubePath(pathname) ? [TIENDANUBE_GROUP_KEY] : [],
  );

  // Navigating directly to any Tiendanube page opens its parent group.
  useEffect(() => {
    if (isTiendanubePath(pathname)) {
      setOpenKeys((current) =>
        current.includes(TIENDANUBE_GROUP_KEY)
          ? current
          : [...current, TIENDANUBE_GROUP_KEY],
      );
    }
  }, [pathname]);

  return (
    <Menu
      className={styles.navigationMenu}
      items={menuItems}
      mode="inline"
      inlineCollapsed={collapsed}
      openKeys={collapsed ? undefined : openKeys}
      onOpenChange={setOpenKeys}
      onClick={onNavigate}
      selectedKeys={activeSection ? [activeSection.href] : []}
    />
  );
}

export function DashboardDesktopNavigation() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <nav
      className={`${styles.desktopNavigation} ${collapsed ? styles.navigationCollapsed : ""}`}
      aria-label="Navegación principal"
    >
      <div className={styles.navigationToggleRow}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expandir menú" : "Contraer menú"}
          onClick={() => setCollapsed((value) => !value)}
        />
      </div>
      <NavigationMenu collapsed={collapsed} />
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
