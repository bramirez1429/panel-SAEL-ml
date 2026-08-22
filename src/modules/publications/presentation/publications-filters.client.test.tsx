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
  });

  it("writes submitted filters to the URL and resets the page", async () => {
    const user = userEvent.setup();

    render(
      <PublicationsFilters
        filters={{
          page: 2,
          cursor: "cursor-2",
          search: "anterior",
          type: null,
          status: "paused",
        }}
      />,
    );

    const search = screen.getByRole("textbox", { name: "Buscar" });
    const status = screen.getByRole("textbox", { name: "Estado" });

    await user.clear(search);
    await user.type(search, "campera azul");
    await user.clear(status);
    await user.type(status, "active");
    await user.click(
      screen.getByRole("button", { name: "Aplicar filtros" }),
    );

    await waitFor(() => {
      expect(navigation.push).toHaveBeenCalledWith(
        "/publicaciones?page=1&cursor=&search=campera+azul&type=&status=active",
      );
    });
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
});
