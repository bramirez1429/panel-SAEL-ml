import type { DashboardSection } from "./dashboard-sections";
import { dashboardSections } from "./dashboard-sections";

export const TIENDANUBE_GROUP_KEY = "group:tiendanube";

export type DashboardNavigationEntry =
  | Readonly<{ kind: "link"; section: DashboardSection }>
  | Readonly<{
      kind: "group";
      key: typeof TIENDANUBE_GROUP_KEY;
      title: "Tienda Nube";
      sections: readonly DashboardSection[];
    }>;

function isTiendanubeSection(section: DashboardSection): boolean {
  return section.href.startsWith("/tiendanube/");
}

/**
 * Preserves the flat dashboardSections list for route titles and active-route
 * lookup. Only the navigation presentation is nested.
 *
 * Every /tiendanube/ route automatically becomes a submenu item, once, at
 * the position of the first Tiendanube route.
 */
export function createDashboardNavigationEntries(
  sections: readonly DashboardSection[] = dashboardSections,
): readonly DashboardNavigationEntry[] {
  const tiendanubeSections = sections.filter(isTiendanubeSection);
  let groupInserted = false;

  return sections.flatMap((section): DashboardNavigationEntry[] => {
    if (!isTiendanubeSection(section)) {
      return [{ kind: "link", section }];
    }
    if (groupInserted) return [];
    groupInserted = true;
    return [{
      kind: "group",
      key: TIENDANUBE_GROUP_KEY,
      title: "Tienda Nube",
      sections: tiendanubeSections,
    }];
  });
}

export function getTiendanubeSubmenuTitle(section: DashboardSection): string {
  if (section.href === "/tiendanube/productos") return "Productos";
  return section.title.replace(/^Tiendanube\s*[—-]\s*/iu, "");
}

export function isTiendanubePath(pathname: string): boolean {
  return pathname === "/tiendanube" || pathname.startsWith("/tiendanube/");
}
