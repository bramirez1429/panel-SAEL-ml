
import { createElement, type ReactNode } from "react";
import {
  ApiOutlined,
  ClockCircleOutlined,
  CloudUploadOutlined,
  SwapOutlined,
  DashboardOutlined,
  FileTextOutlined,
  PercentageOutlined,
  PictureOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  SyncOutlined,
  TagsOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";

export type DashboardSection = Readonly<{
  href: `/${string}`;
  title: string;
  icon?: ReactNode;
}>;

export const dashboardSections = [
  { href: "/dashboard", title: "Dashboard", icon: createElement(DashboardOutlined) },
  { href: "/tiendanube/productos", title: "Tiendanube", icon: createElement(ShopOutlined) },
  { href: "/tienda-negocio/sincronizacion", title: "Sincronización Tienda Negocio", icon: createElement(SyncOutlined) },
  { href: "/tiendanube/edicion-masiva", title: "Tiendanube — Edición masiva", icon: createElement(TagsOutlined) },
  { href: "/tiendanube/talles-masivos", title: "Tiendanube — Talles masivos", icon: createElement(TagsOutlined) },
  { href: "/sincronizacion", title: "Sincronización", icon: createElement(SyncOutlined) },
  { href: "/publicaciones", title: "Publicaciones", icon: createElement(FileTextOutlined) },
  { href: "/replicar", title: "Replicar", icon: createElement(CloudUploadOutlined) },
  { href: "/migracion-global", title: "Migración global", icon: createElement(SwapOutlined) },
  { href: "/publicacion-promocion", title: "Publicación y promoción", icon: createElement(TagsOutlined) },
  { href: "/ranking-productos", title: "Ranking productos", icon: createElement(TrophyOutlined) },
  { href: "/promociones", title: "Promociones", icon: createElement(PercentageOutlined) },
  { href: "/ventas", title: "Ventas 24 hs", icon: createElement(ClockCircleOutlined) },
  { href: "/pedidos", title: "Pedidos", icon: createElement(ShoppingCartOutlined) },
  { href: "/usuarios", title: "Usuarios", icon: createElement(TeamOutlined) },
  { href: "/integraciones", title: "Integraciones", icon: createElement(ApiOutlined) },
  { href: "/catalogo/imagenes", title: "Imágenes del catálogo", icon: createElement(PictureOutlined) },
] as const satisfies readonly DashboardSection[];

export function findDashboardSection(pathname: string) {
  return dashboardSections.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
}
