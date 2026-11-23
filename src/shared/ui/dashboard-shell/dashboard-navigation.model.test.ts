import { describe, expect, it } from "vitest";
import {
  createDashboardNavigationEntries,
  getTiendanubeSubmenuTitle,
  isTiendanubePath,
  TIENDANUBE_GROUP_KEY,
} from "./dashboard-navigation.model";
import { dashboardSections } from "./dashboard-sections";

describe("menú desplegable Tienda Nube", () => {
  it("agrupa todas las rutas Tiendanube exactamente una vez", () => {
    const navigation = createDashboardNavigationEntries();
    const groups = navigation.filter((entry) => entry.kind === "group");
    expect(groups).toHaveLength(1);
    const group = groups[0];
    expect(group).toMatchObject({
      kind: "group",
      key: TIENDANUBE_GROUP_KEY,
      title: "Tienda Nube",
    });
    if (group?.kind !== "group") throw new Error("Falta menú Tienda Nube");

    expect(group.sections.map((entry) => entry.href)).toEqual([
      "/tiendanube/productos",
      "/tiendanube/edicion-masiva",
      "/tiendanube/talles-masivos",
    ]);

    const allLinks = navigation.flatMap((entry) =>
      entry.kind === "link" ? [entry.section.href] : entry.sections.map((section) => section.href),
    );
    expect(allLinks).toHaveLength(dashboardSections.length);
    expect(new Set(allLinks).size).toBe(dashboardSections.length);
    expect(allLinks).toEqual(dashboardSections.map((section) => section.href));
  });

  it("conserva Tienda Negocio y calculadora como accesos independientes", () => {
    const navigation = createDashboardNavigationEntries();
    const links = navigation.filter((entry) => entry.kind === "link")
      .map((entry) => entry.section.href);
    expect(links).toContain("/tienda-negocio/sincronizacion");
    expect(links).toContain("/calculadora-precios");
    expect(links).toContain("/publicacion-promocion");
  });

  it("usa títulos cortos y admite nuevas secciones de Tiendanube", () => {
    const section = dashboardSections.find((entry) => entry.href === "/tiendanube/productos");
    if (!section) throw new Error("Falta la sección Productos");
    expect(getTiendanubeSubmenuTitle(section)).toBe("Productos");
    expect(getTiendanubeSubmenuTitle({
      href: "/tiendanube/edicion-masiva",
      title: "Tiendanube — Edición masiva",
    })).toBe("Edición masiva");

    const future = { href: "/tiendanube/nuevo-modulo" as const, title: "Tiendanube — Nuevo módulo" };
    const entries = createDashboardNavigationEntries([...dashboardSections, future]);
    const group = entries.find((entry) => entry.kind === "group");
    expect(group?.kind === "group" ? group.sections.map((entry) => entry.href) : []).toContain(future.href);
    expect(entries.filter((entry) => entry.kind === "link" &&
      entry.section.href === future.href)).toHaveLength(0);
  });

  it("reconoce ruta Tiendanube y subrutas sin abrirse en otras pantallas", () => {
    expect(isTiendanubePath("/tiendanube/productos")).toBe(true);
    expect(isTiendanubePath("/tiendanube/edicion-masiva/123")).toBe(true);
    expect(isTiendanubePath("/tiendanube/talles-masivos")).toBe(true);
    expect(isTiendanubePath("/tienda-negocio/sincronizacion")).toBe(false);
    expect(isTiendanubePath("/dashboard")).toBe(false);
  });
});
