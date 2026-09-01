import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PublicationSearchBar } from "./publication-search-bar.client";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  params: new URLSearchParams("promotionStatus=AVAILABLE&cursor=old"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.params,
}));

describe("PublicationSearchBar", () => {
  beforeEach(() => {
    navigation.push.mockReset();
    sessionStorage.clear();
  });
  afterEach(cleanup);

  it("normaliza MLA, conserva filtros y elimina cursor", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem("promotions:cursor-history:anterior", "{\"2\":\"old\"}");
    render(<PublicationSearchBar initialSearch="" />);

    await user.type(screen.getByRole("textbox", { name: "Buscar publicaciones" }), "mla1947917494");
    fireEvent.submit(screen.getByRole("textbox", { name: "Buscar publicaciones" }).closest("form")!);

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith(
      "/promociones?promotionStatus=AVAILABLE&page=1&search=MLA1947917494",
    ));
    expect(sessionStorage.length).toBe(0);
  });

  it("limpia la búsqueda y vuelve al listado normal", async () => {
    const user = userEvent.setup();
    render(<PublicationSearchBar initialSearch="remera" />);

    await user.click(screen.getByRole("button", { name: "Limpiar" }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/promociones?promotionStatus=AVAILABLE&page=1"));
  });
});
