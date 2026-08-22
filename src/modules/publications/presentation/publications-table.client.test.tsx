import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PublicationsPage } from "../domain/publication.model";
import { PublicationsTable } from "./publications-table.client";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(
    "page=1&search=campera&type=LEGACY&status=active",
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.searchParams,
}));

const page: PublicationsPage = {
  publications: [],
  page: 1,
  pageSize: 20,
  count: 0,
  total: 42,
  totalPages: 3,
};

const pageWithPublication: PublicationsPage = {
  ...page,
  publications: [
    {
      id: "publication/id",
      title: "Publicación real",
      channel: "MERCADO_LIBRE",
      status: "active",
      thumbnailUrl: null,
      permalink: "https://example.com/external",
      price: {
        from: 1000,
        to: 1250,
        currency: "ARS",
      },
      stock: 4,
      group: {
        key: "item:MLA1",
        type: "LEGACY",
        familyId: null,
        itemId: "MLA1",
        childrenCount: 0,
      },
    },
  ],
  count: 1,
};

describe("PublicationsTable", () => {
  afterEach(() => {
    cleanup();
    navigation.push.mockReset();
  });

  it("updates only the page while preserving URL filters", async () => {
    const user = userEvent.setup();
    const { container } = render(<PublicationsTable page={page} />);
    const nextPageButton = container.querySelector<HTMLButtonElement>(
      ".ant-pagination-next button",
    );

    expect(nextPageButton).not.toBeNull();

    if (!nextPageButton) {
      throw new Error("Pagination must render a next-page button");
    }

    await user.click(nextPageButton);

    expect(navigation.push).toHaveBeenCalledWith(
      "/publicaciones?page=2&search=campera&type=LEGACY&status=active",
    );
  });

  it("links each action to the internal publication detail", () => {
    render(<PublicationsTable page={pageWithPublication} />);

    expect(screen.getByRole("link", { name: "Ver detalle" })).toHaveAttribute(
      "href",
      "/publicaciones/publication%2Fid",
    );
  });

  it("renders the real publication fields in the stable Ant Design table", () => {
    render(<PublicationsTable page={pageWithPublication} />);

    expect(
      screen.getByRole("region", { name: "Tabla de publicaciones" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Publicación real")).toBeInTheDocument();
    expect(screen.getByText("Mercado Libre")).toBeInTheDocument();
    expect(screen.getByText("Legacy")).toBeInTheDocument();
    expect(screen.getByText("ARS 1.000 – ARS 1.250")).toBeInTheDocument();
    expect(screen.getByText("1–20 de 42")).toBeInTheDocument();
  });
});
