"use client";

import { useState } from "react";
import { Button, Drawer, Menu } from "antd";
import type { MenuProps } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./dashboard-shell.module.css";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/publicaciones", label: "Publicaciones" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/integraciones", label: "Integraciones" },
] as const;

const menuItems: MenuProps["items"] = navigationItems.map(({ href, label }) => ({
  key: href,
  label: <Link href={href}>{label}</Link>,
}));

type NavigationMenuProps = Readonly<{
  onNavigate?: () => void;
}>;

function NavigationMenu({ onNavigate }: NavigationMenuProps) {
  const pathname = usePathname();
  const activeItem = navigationItems.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );

  return (
    <Menu
      className={styles.navigationMenu}
      items={menuItems}
      mode="inline"
      onClick={onNavigate}
      selectedKeys={activeItem ? [activeItem.href] : []}
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

export function DashboardMobileNavigation() {
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
      </Drawer>
    </div>
  );
}
