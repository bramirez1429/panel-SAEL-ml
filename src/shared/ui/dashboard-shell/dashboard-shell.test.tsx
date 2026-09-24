import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardShell } from "./dashboard-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("DashboardShell current user", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra el nombre autenticado", () => {
    render(<DashboardShell currentUser={{ name: "Bryan Ramirez", email: "bryan@example.com" }} logoutAction={async () => undefined}>Contenido</DashboardShell>);
    expect(screen.getByLabelText("Usuario autenticado: Bryan Ramirez")).toBeInTheDocument();
    expect(screen.getByText("Bryan Ramirez")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("usa email cuando el nombre es null", () => {
    render(<DashboardShell currentUser={{ name: null, email: "bryan@example.com" }} logoutAction={async () => undefined}>Contenido</DashboardShell>);
    expect(screen.getByLabelText("Usuario autenticado: bryan@example.com")).toBeInTheDocument();
    expect(screen.getByText("bryan@example.com")).toBeInTheDocument();
  });
});
