import { describe, expect, it } from "vitest";

import { findDashboardSection } from "./dashboard-sections";

describe("findDashboardSection", () => {
  it("finds sections for exact and nested paths", () => {
    expect(findDashboardSection("/pedidos")?.title).toBe("Pedidos");
    expect(findDashboardSection("/publicaciones/123")?.title).toBe(
      "Publicaciones",
    );
  });

  it("returns undefined for a path outside the dashboard sections", () => {
    expect(findDashboardSection("/otra-ruta")).toBeUndefined();
  });
});
