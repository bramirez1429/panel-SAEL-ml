export type DashboardSection = Readonly<{
  href: `/${string}`;
  title: string;
}>;

export const dashboardSections = [
  { href: "/dashboard", title: "Dashboard" },
  { href: "/publicaciones", title: "Publicaciones" },
  { href: "/pedidos", title: "Pedidos" },
  { href: "/integraciones", title: "Integraciones" },
] as const satisfies readonly DashboardSection[];

export function findDashboardSection(pathname: string) {
  return dashboardSections.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
}
