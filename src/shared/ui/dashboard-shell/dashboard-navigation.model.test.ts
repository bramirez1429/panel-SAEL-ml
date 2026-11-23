import { describe, expect, it } from "vitest";

import {
  createDashboardNavigationEntries,
  getMenuGroupForPath,
  getSyncSubmenuTitle,
  getTiendanubeSubmenuTitle,
  isSyncPath,
  isTiendanubePath,
  SYNC_GROUP_KEY,
  TIENDANUBE_GROUP_KEY,
} from "./dashboard-navigation.model";
import { dashboardSections } from "./dashboard-sections";

describe("menús desplegables Tienda Nube y Sincronización", () => {
  it("agrupa todos los accesos existentes sin duplicar ni perder rutas", () => {
    const entries = createDashboardNavigationEntries();
    const groups = entries.filter((entry) => entry.kind === "group");
    expect(groups).toHaveLength(2);

    const tiendanube = groups.find((entry) => entry.key === TIENDANUBE_GROUP_KEY);
    if (tiendanube?.kind !== "group") throw new Error("Falta Tienda Nube");
    expect(tiendanube.title).toBe("Tienda Nube");
    expect(tiendanube.sections.map((entry) => entry.href)).toEqual([
      "/tiendanube/productos",
      "/tiendanube/edicion-masiva",
      "/tiendanube/talles-masivos",
    ]);

    const sync = groups.find((entry) => entry.key === SYNC_GROUP_KEY);
    if (sync?.kind !== "group") throw new Error("Falta Sincronización");
    expect(sync.title).toBe("Sincronización");
    expect(sync.sections.map((entry) => entry.href)).toEqual([
      "/tienda-negocio/sincronizacion",
      "/sincronizacion",
    ]);

    const allLinks = entries.flatMap((entry) =>
      entry.kind === "link" ? [entry.section.href] :
        entry.sections.map((section) => section.href),
    );
    expect(allLinks).toHaveLength(dashboardSections.length);
    expect(new Set(allLinks).size).toBe(dashboardSections.length);
    expect([...allLinks].sort()).toEqual(dashboardSections.map((item) => item.href).sort());
    expect(entries[0]?.kind).toBe("link");
  });

  it("conserva otras herramientas como accesos principales", () => {
    const links = createDashboardNavigationEntries()
      .filter((entry) => entry.kind === "link")
      .map((entry) => entry.section.href);
    expect(links).toContain("/calculadora-precios");
    expect(links).toContain("/publicacion-promocion");
    expect(links).toContain("/replicar");
  });

  it("abre el grupo correcto en rutas principales y subrutas", () => {
    expect(getMenuGroupForPath("/tiendanube/productos")).toBe(TIENDANUBE_GROUP_KEY);
    expect(getMenuGroupForPath("/tiendanube/talles-masivos")).toBe(TIENDANUBE_GROUP_KEY);
    expect(getMenuGroupForPath("/sincronizacion")).toBe(SYNC_GROUP_KEY);
    expect(getMenuGroupForPath("/sincronizacion/estado")).toBe(SYNC_GROUP_KEY);
    expect(getMenuGroupForPath("/tienda-negocio/sincronizacion/producto")).toBe(SYNC_GROUP_KEY);
    expect(getMenuGroupForPath("/dashboard")).toBeNull();
    expect(isTiendanubePath("/sincronizacion")).toBe(false);
    expect(isSyncPath("/tiendanube/productos")).toBe(false);
    expect(isSyncPath("/tienda-negocio/otra")).toBe(false);
  });

  it("mantiene títulos breves y reconoce futuras rutas de Tiendanube", () => {
    expect(getSyncSubmenuTitle({
      href: "/sincronizacion", title: "Sincronización",
    })).toBe("Mercado Libre");
    expect(getSyncSubmenuTitle({
      href: "/tienda-negocio/sincronizacion", title: "Sincronización Tienda Negocio",
    })).toBe("Tienda Negocio");
    expect(getTiendanubeSubmenuTitle({
      href: "/tiendanube/edicion-masiva", title: "Tiendanube — Edición masiva",
    })).toBe("Edición masiva");

    const future = {
      href: "/tiendanube/nuevo-modulo" as const,
      title: "Tiendanube — Nuevo módulo",
    };
    const entries = createDashboardNavigationEntries([...dashboardSections, future]);
    const group = entries.find((entry) => entry.kind === "group" &&
      entry.key === TIENDANUBE_GROUP_KEY);
    expect(group?.kind === "group" ?
      group.sections.map((entry) => entry.href) : []).toContain(future.href);
  });
});
