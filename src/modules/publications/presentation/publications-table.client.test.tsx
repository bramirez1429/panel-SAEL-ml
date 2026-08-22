import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PublicationsPage } from "../domain/publication.model";
import { PublicationsTable } from "./publications-table.client";

const navigation = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
  searchParams: new URLSearchParams(
    "page=1&cursor=&search=campera&type=LEGACY&status=active",
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: navigation.back, push: navigation.push }),
  useSearchParams: () => navigation.searchParams,
}));

const page: PublicationsPage = {
  publications: [],
  page: 1,
  pageSize: 20,
  cursor: null,
  nextCursor: "cursor-2",
  done: false,
  count: 0,
  productsCount: 20,
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
      permalink: null,
      price: { from: 1000, to: 1250, currency: null },
      stock: 4,
      sold: 3,
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
    navigation.back.mockReset();
    navigation.push.mockReset();
  });

  it("uses the backend cursor for the next page while preserving filters", async () => {
    const user = userEvent.setup();
    render(<PublicationsTable page={pageWithPublication} />);

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(navigation.push).toHaveBeenCalledWith(
      "/publicaciones?page=2&cursor=cursor-2&search=campera&type=LEGACY&status=active",
    );
  });

  it("links each action to the internal publication detail", () => {
    render(<PublicationsTable page={pageWithPublication} />);

    expect(screen.getByRole("link", { name: "Ver detalle" })).toHaveAttribute(
      "href",
      "/publicaciones/publication%2Fid",
    );
  });

  it("renders real grouped publication fields in the Ant Design table", () => {
    render(<PublicationsTable page={pageWithPublication} />);

    expect(screen.getByRole("region", { name: "Tabla de publicaciones" })).toBeInTheDocument();
    expect(screen.getByText("Publicación real")).toBeInTheDocument();
    expect(screen.getByText("Mercado Libre")).toBeInTheDocument();
    expect(screen.getByText("Legacy")).toBeInTheDocument();
    expect(screen.getByText("1.000 — 1.250")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
