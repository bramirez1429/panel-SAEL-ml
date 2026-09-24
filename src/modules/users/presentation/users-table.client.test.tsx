import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UsersTable } from "./users-table.client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("./create-user-modal.client", () => ({
  CreateUserModal: () => null,
}));

describe("UsersTable", () => {
  it("mantiene el encabezado y la acción de nuevo usuario", () => {
    render(<UsersTable users={[]} />);
    expect(screen.getByText("Usuarios")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nuevo usuario/i })).toBeInTheDocument();
  });
});
