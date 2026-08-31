import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./publication-search-bar.client", () => ({
  PublicationSearchBar: ({ initialSearch }: Readonly<{ initialSearch: string }>) => (
    <form aria-label="Buscador" data-initial-search={initialSearch}>Buscador</form>
  ),
}));

import { PromotionsSearchTopbar } from "./promotions-search-topbar";
import styles from "./promotions-search-topbar.module.css";

describe("PromotionsSearchTopbar", () => {
  afterEach(cleanup);

  it("envuelve una sola instancia del buscador conservando el search SSR", () => {
    render(<PromotionsSearchTopbar initialSearch="MLA1947917494" />);

    const topbar = screen.getByTestId("promotions-search-topbar");
    const stickyClass = styles.topbar;
    expect(stickyClass).toBeDefined();
    if (!stickyClass) throw new Error("Falta la clase sticky de la topbar");
    expect(topbar).toHaveClass(stickyClass);
    expect(screen.getAllByRole("form")).toHaveLength(1);
    expect(screen.getByRole("form")).toHaveAttribute("data-initial-search", "MLA1947917494");
  });
});
