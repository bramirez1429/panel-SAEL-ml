import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardTasks } from "./dashboard-tasks.client";

const STORAGE_KEY = "sael:dashboard:tasks:v1";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Agenda de tareas SAEL", () => {
  it("agenda una tarea con número de publicación y la conserva al recargar", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<DashboardTasks />);
    expect(screen.getByRole("heading", { name: "Tareas pendientes" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nueva tarea" }));
    await user.type(screen.getByLabelText("¿Qué tenés que hacer? *"), "Agregar remera color chocolate");
    await user.type(screen.getByLabelText("N.º de publicación o Family ID"), "MLA12345678");
    await user.type(screen.getByLabelText("Detalle (opcional)"), "Talle M y XL");
    await user.click(screen.getByRole("button", { name: "Agendar tarea" }));

    expect(await screen.findByText("Agregar remera color chocolate")).toBeInTheDocument();
    expect(screen.getByText("MLA12345678")).toBeInTheDocument();
    expect(screen.getByText("Talle M y XL")).toBeInTheDocument();

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        title: "Agregar remera color chocolate",
        publicationId: "MLA12345678",
        notes: "Talle M y XL",
        done: false,
      });
    });

    unmount();
    render(<DashboardTasks />);
    expect(await screen.findByText("Agregar remera color chocolate")).toBeInTheDocument();
    expect(screen.getByText("MLA12345678")).toBeInTheDocument();
  });

  it("permite completar, volver a ver y editar una tarea", async () => {
    const user = userEvent.setup();
    render(<DashboardTasks />);
    await user.click(screen.getByRole("button", { name: "Nueva tarea" }));
    await user.type(screen.getByLabelText("¿Qué tenés que hacer? *"), "Agregar stock");
    await user.click(screen.getByRole("button", { name: "Agendar tarea" }));

    await user.click(screen.getByRole("checkbox", { name: "Completar tarea: Agregar stock" }));
    expect(screen.getByText("No tenés tareas pendientes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Todas/ }));
    expect(screen.getByText("Agregar stock")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Editar tarea: Agregar stock" }));
    const title = screen.getByLabelText("¿Qué tenés que hacer? *");
    await user.clear(title);
    await user.type(title, "Agregar stock de remeras");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(screen.getByText("Agregar stock de remeras")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")[0]).toMatchObject({
      done: true,
      title: "Agregar stock de remeras",
    });
  });

  it("elimina únicamente tras confirmar", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DashboardTasks />);
    await user.click(screen.getByRole("button", { name: "Nueva tarea" }));
    await user.type(screen.getByLabelText("¿Qué tenés que hacer? *"), "Actualizar fotografía");
    await user.click(screen.getByRole("button", { name: "Agendar tarea" }));

    await user.click(screen.getByRole("button", { name: "Eliminar tarea: Actualizar fotografía" }));
    expect(screen.getByText("Actualizar fotografía")).toBeInTheDocument();
    confirm.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Eliminar tarea: Actualizar fotografía" }));
    expect(screen.queryByText("Actualizar fotografía")).not.toBeInTheDocument();
  });
});
