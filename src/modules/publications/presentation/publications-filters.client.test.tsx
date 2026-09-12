import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PublicationsFilters } from "./publications-filters.client";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(
    "page=2&search=anterior&type=&status=paused",
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.searchParams,
}));

describe("PublicationsFilters", () => {
  afterEach(cleanup);

  beforeEach(() => {
    navigation.push.mockReset();
    navigation.searchParams = new URLSearchParams(
      "page=2&search=anterior&type=&status=paused",
    );
    sessionStorage.clear();
  });

  it("writes submitted status to the URL, preserves search and resets the page", async () => {
    const user = userEvent.setup();

    render(
      <PublicationsFilters
        filters={{
          page: 2,
          cursor: "cursor-2",
          search: "anterior",
          type: null,
          status: "paused",
          quickFilters: [],
        }}
      />,
    );

    const status = screen.getByRole("textbox", { name: "Estado" });

    await user.clear(status);
    await user.type(status, "active");
    await user.click(
      screen.getByRole("button", { name: "Aplicar filtros" }),
    );

    await waitFor(() => {
      expect(navigation.push).toHaveBeenCalledWith(
        "/publicaciones?page=1&cursor=&search=anterior&type=&status=active",
      );
    });
  });

  it("reutiliza el buscador de Mercado Libre y conserva los otros filtros", async () => {
    const user = userEvent.setup();
    render(<PublicationsFilters filters={{ page: 2, cursor: "cursor-2", search: "anterior", type: null, status: "paused", quickFilters: [] }} />);

    const search = screen.getByRole("textbox", { name: "Buscar publicaciones" });
    await user.clear(search);
    await user.type(search, "mla1491447379");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith(
      "/publicaciones?page=1&search=MLA1491447379&type=&status=paused",
    ));
  });

  it("writes the selected publication type and resets the page", async () => {
    const user = userEvent.setup();

    render(
      <PublicationsFilters
        filters={{
          page: 2,
          cursor: "cursor-2",
          search: "anterior",
          type: null,
          status: "paused",
          quickFilters: [],
        }}
      />,
    );

    await user.click(
      screen.getByRole("combobox", { name: "Filtrar por tipo" }),
    );
    await user.click(await screen.findByText("Familia"));

    await waitFor(() => {
      expect(navigation.push).toHaveBeenCalledWith(
        "/publicaciones?page=1&cursor=&search=anterior&type=USER_PRODUCT&status=paused",
      );
    });
  });

  it("muestra el buscador global para título e identificadores", () => {
    render(<PublicationsFilters filters={{ page: 1, cursor: null, search: "", type: null, status: "", quickFilters: [] }} />);
    expect(screen.getByPlaceholderText("Buscar por familia, MLA o nombre")).toBeInTheDocument();
  });

  it("muestra los seis filtros rápidos como Switch Sí/No", () => {
    render(<PublicationsFilters filters={{ page: 1, cursor: null, search: "", type: null, status: "", quickFilters: [] }} />);

    expect(screen.getAllByRole("switch")).toHaveLength(6);
    [
      "Remera de mujer",
      "Buzo de mujer",
      "Remera de niña",
      "Buzo de niña",
      "Remera de niño",
      "Buzo de niño",
    ].forEach((label) => {
      expect(screen.getByRole("switch", { name: label })).toHaveTextContent("No");
    });
  });

  it("activa un filtro rápido y reinicia la página", async () => {
    const user = userEvent.setup();
    render(<PublicationsFilters filters={{ page: 2, cursor: "cursor-2", search: "anterior", type: null, status: "paused", quickFilters: [] }} />);

    await user.click(screen.getByRole("switch", { name: "Remera de mujer" }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith(
      "/publicaciones?page=1&cursor=&search=anterior&type=&status=paused&quick=WOMEN_TSHIRT",
    ));
  });

  it("Limpiar borra la búsqueda y todos los switches", async () => {
    navigation.searchParams = new URLSearchParams(
      "page=2&search=remera&type=&status=paused&quick=GIRLS_TSHIRT",
    );
    const user = userEvent.setup();
    render(<PublicationsFilters filters={{ page: 2, cursor: null, search: "remera", type: null, status: "paused", quickFilters: ["GIRLS_TSHIRT"] }} />);

    expect(screen.getByRole("switch", { name: "Remera de niña" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Limpiar" }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith(
      "/publicaciones?page=1&type=&status=paused",
    ));
  });
});
