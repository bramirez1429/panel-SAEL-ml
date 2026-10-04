import { createElement, type ReactNode } from "react";
import { PictureOutlined } from "@ant-design/icons";

export type DashboardSection = Readonly<{
  href: `/${string}`;
  title: string;
  icon?: ReactNode;
}>;

export const dashboardSections = [
  { href: "/dashboard", title: "Dashboard" },
  { href: "/publicaciones", title: "Publicaciones" },
  { href: "/publicacion-promocion", title: "Publicación y promoción" },
  { href: "/ranking-productos", title: "Ranking productos" },
  { href: "/promociones", title: "Promociones" },
  { href: "/ventas", title: "Ventas 24 hs" },
  { href: "/pedidos", title: "Pedidos" },
  { href: "/usuarios", title: "Usuarios" },
  { href: "/integraciones", title: "Integraciones" },
  { href: "/catalogo/imagenes", title: "Imágenes del catálogo", icon: createElement(PictureOutlined) },
] as const satisfies readonly DashboardSection[];

export function findDashboardSection(pathname: string) {
  return dashboardSections.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
}
