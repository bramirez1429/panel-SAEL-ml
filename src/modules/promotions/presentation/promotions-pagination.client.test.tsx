import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PromotionsPage } from "../domain/promotion.model";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.params,
}));

import { PromotionsPagination } from "./promotions-pagination.client";

describe("PromotionsPagination", () => {
  beforeEach(() => {
    navigation.push.mockReset();
    [...navigation.params.keys()].forEach((key) => navigation.params.delete(key));
    sessionStorage.clear();
  });
  afterEach(cleanup);

  it("reemplaza Siguiente por Pagination y habilita sólo la página siguiente conocida", () => {
    renderPagination(page(false, "cursor-2"));

    expect(screen.queryByRole("button", { name: "Siguiente" })).not.toBeInTheDocument();
    expect(screen.getByTitle("1")).toBeInTheDocument();
    expect(screen.getByTitle("2")).toBeInTheDocument();
    expect(screen.queryByTitle("3")).not.toBeInTheDocument();
  });

  it("done=true no inventa una página siguiente", () => {
    renderPagination(page(true, null));

    expect(screen.getByTitle("1")).toBeInTheDocument();
    expect(screen.queryByTitle("2")).not.toBeInTheDocument();
  });

  it("conserva búsqueda/filtros y agrega page con el cursor real", async () => {
    const user = userEvent.setup();
    navigation.params.set("search", "remera");
    navigation.params.set("productGroup", "WOMEN_TSHIRT");
    navigation.params.set("promotionStatus", "AVAILABLE");
    navigation.params.set("promotionType", "DEAL");
    renderPagination(page(false, "cursor-2"));

    await user.click(screen.getByTitle("2"));

    expect(navigation.push).toHaveBeenCalledWith(
      "/promociones?search=remera&productGroup=WOMEN_TSHIRT&promotionStatus=AVAILABLE&promotionType=DEAL&page=2&cursor=cursor-2",
    );
  });

  it("hace un solo push por href aunque el componente se renderice varias veces", async () => {
    const view = renderPagination(page(false, "promotions:20"));
    const pageTwo = screen.getByTitle("2");

    fireEvent.click(pageTwo);
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith(
      "/promociones?page=2&cursor=promotions%3A20",
    ));
    view.rerender(component(page(false, "promotions:20")));
    view.rerender(component(page(false, "promotions:20")));
    view.rerender(component(page(false, "promotions:20")));

    expect(await screen.findByText("Cargando publicaciones...")).toBeInTheDocument();
    expect(navigation.push).toHaveBeenCalledTimes(1);
  });

  it("StrictMode mantiene un único push por interacción", async () => {
    render(<StrictMode>{component(page(false, "promotions:20"))}</StrictMode>);

    fireEvent.click(screen.getByTitle("2"));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith(
      "/promociones?page=2&cursor=promotions%3A20",
    ));
    expect(navigation.push).toHaveBeenCalledTimes(1);
  });

  it("durante loading bloquea un segundo click", async () => {
    renderPagination(page(false, "promotions:20"));
    const pageTwo = screen.getByTitle("2");

    fireEvent.click(pageTwo);
    fireEvent.click(pageTwo);

    expect(await screen.findByText("Cargando publicaciones...")).toBeInTheDocument();
    await waitFor(() => expect(navigation.push).toHaveBeenCalledTimes(1));
  });

  it("no vuelve a navegar cuando la URL ya representa la página actual", async () => {
    const user = userEvent.setup();
    setLocationPage(2, "promotions:20");
    renderPagination(page(false, "promotions:40"));

    await user.click(screen.getByTitle("2"));

    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("limpia loading al completar página 2 y permite un único push a página 3", async () => {
    const view = renderPagination(page(false, "promotions:20"));
    fireEvent.click(screen.getByTitle("2"));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Cargando publicaciones...")).toBeInTheDocument();

    setLocationPage(2, "promotions:20");
    view.rerender(component(page(false, "promotions:40")));
    await waitFor(() => expect(screen.queryByText("Cargando publicaciones...")).not.toBeInTheDocument());
    fireEvent.click(screen.getByTitle("3"));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledTimes(2));
    expect(navigation.push).toHaveBeenLastCalledWith(
      "/promociones?page=3&cursor=promotions%3A40",
    );
  });

  it("vuelve a una página visitada usando su cursor", async () => {
    const user = userEvent.setup();
    const view = renderPagination(page(false, "cursor-2"));
    await user.click(screen.getByTitle("2"));

    setLocationPage(2, "cursor-2");
    view.rerender(component(page(false, "cursor-3")));
    await waitFor(() => expect(screen.getByTitle("3")).toBeInTheDocument());
    await user.click(screen.getByTitle("3"));

    setLocationPage(3, "cursor-3");
    view.rerender(component(page(false, "cursor-4")));
    await waitFor(() => expect(screen.getByTitle("2")).toBeInTheDocument());
    await user.click(screen.getByTitle("2"));

    expect(navigation.push).toHaveBeenLastCalledWith("/promociones?page=2&cursor=cursor-2");
  });
});

function renderPagination(value: PromotionsPage) {
  return render(component(value));
}

function component(value: PromotionsPage) {
  return <PromotionsPagination page={value}><div>Tabla</div></PromotionsPagination>;
}

function page(done: boolean, nextCursor: string | null): PromotionsPage {
  return { publications: [], count: 0, done, nextCursor };
}

function setLocationPage(currentPage: number, cursor: string): void {
  navigation.params.set("page", String(currentPage));
  navigation.params.set("cursor", cursor);
}
