import type { DashboardSection } from "./dashboard-sections";
import { dashboardSections } from "./dashboard-sections";

export const TIENDANUBE_GROUP_KEY = "group:tiendanube";
export const SYNC_GROUP_KEY = "group:sincronizacion";

type DashboardGroupKey = typeof TIENDANUBE_GROUP_KEY | typeof SYNC_GROUP_KEY;

export type DashboardNavigationEntry =
  | Readonly<{ kind: "link"; section: DashboardSection }>
  | Readonly<{
      kind: "group";
      key: DashboardGroupKey;
      title: "Tienda Nube" | "Sincronización";
      sections: readonly DashboardSection[];
    }>;

function isTiendanubeSection(section: DashboardSection): boolean {
  return section.href.startsWith("/tiendanube/");
}

function isSyncSection(section: DashboardSection): boolean {
  return section.href === "/sincronizacion" ||
    section.href === "/tienda-negocio/sincronizacion";
}

function groupKeyForSection(section: DashboardSection): DashboardGroupKey | null {
  if (isTiendanubeSection(section)) return TIENDANUBE_GROUP_KEY;
  if (isSyncSection(section)) return SYNC_GROUP_KEY;
  return null;
}

/**
 * Only changes navigation display. dashboardSections remains flat so that
 * page headers, route selection and the existing screens keep working.
 * Groups appear at their first route's position in the original menu.
 */
export function createDashboardNavigationEntries(
  sections: readonly DashboardSection[] = dashboardSections,
): readonly DashboardNavigationEntry[] {
  const tiendanubeSections = sections.filter(isTiendanubeSection);
  const syncSections = sections.filter(isSyncSection);
  const inserted = new Set<DashboardGroupKey>();

  return sections.flatMap((section): DashboardNavigationEntry[] => {
    const key = groupKeyForSection(section);
    if (!key) return [{ kind: "link", section }];
    if (inserted.has(key)) return [];
    inserted.add(key);

    return key === TIENDANUBE_GROUP_KEY
      ? [{ kind: "group", key, title: "Tienda Nube", sections: tiendanubeSections }]
      : [{ kind: "group", key, title: "Sincronización", sections: syncSections }];
  });
}

export function getTiendanubeSubmenuTitle(section: DashboardSection): string {
  if (section.href === "/tiendanube/productos") return "Productos";
  return section.title.replace(/^Tiendanube\s*[—-]\s*/iu, "");
}

export function getSyncSubmenuTitle(section: DashboardSection): string {
  if (section.href === "/sincronizacion") return "Mercado Libre";
  if (section.href === "/tienda-negocio/sincronizacion") return "Tienda Negocio";
  return section.title;
}

export function isTiendanubePath(pathname: string): boolean {
  return pathname === "/tiendanube" || pathname.startsWith("/tiendanube/");
}

export function isSyncPath(pathname: string): boolean {
  return pathname === "/sincronizacion" || pathname.startsWith("/sincronizacion/") ||
    pathname === "/tienda-negocio/sincronizacion" ||
    pathname.startsWith("/tienda-negocio/sincronizacion/");
}

export function getMenuGroupForPath(pathname: string): DashboardGroupKey | null {
  if (isTiendanubePath(pathname)) return TIENDANUBE_GROUP_KEY;
  if (isSyncPath(pathname)) return SYNC_GROUP_KEY;
  return null;
}
