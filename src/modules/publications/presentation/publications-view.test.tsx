import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import type {
  Publication,
  PublicationsPage,
} from "../domain/publication.model";
import { PublicationsView } from "./publications-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(
    "page=1&search=&type=&status=",
  ),
}));

const filters = {
  page: 1,
  search: "",
  type: null,
  status: "",
} as const;

const publication: Publication = {
  id: "publication-id",
  title: "Publicación real",
  channel: "MERCADO_LIBRE",
  status: "active",
  thumbnailUrl: null,
  permalink: "https://example.com/publication",
  price: { from: 1000, to: 1000, currency: "ARS" },
  stock: 5,
  group: {
    key: "family:1",
    type: "USER_PRODUCT",
    familyId: "1",
    itemId: null,
    childrenCount: 3,
  },
};

const page: PublicationsPage = {
  publications: [publication],
  page: 1,
  pageSize: 20,
  count: 1,
  total: 1,
  totalPages: 1,
};

describe("PublicationsView", () => {
  afterEach(cleanup);

  it("renders its loading state", () => {
    render(<PublicationsView filters={filters} state="loading" />);

    expect(screen.getByText("Cargando publicaciones…")).toBeInTheDocument();
  });

  it("renders controlled errors without hiding their message", () => {
    render(
      <PublicationsView
        errorMessage="El backend no está disponible. Código: API_UNREACHABLE."
        filters={filters}
        state="error"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El backend no está disponible. Código: API_UNREACHABLE.",
    );
  });

  it("renders the empty table state", () => {
    render(
      <PublicationsView
        filters={filters}
        page={{ ...page, publications: [], count: 0, total: 0, totalPages: 0 }}
        state="empty"
      />,
    );

    expect(
      screen.getByText("No se encontraron publicaciones."),
    ).toBeInTheDocument();
  });

  it("renders real domain data in the success table", () => {
    render(
      <PublicationsView filters={filters} page={page} state="success" />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Publicación real")).toBeInTheDocument();
    expect(screen.getByText("Familia")).toBeInTheDocument();
    expect(screen.getByText("ARS 1.000")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver" })).toHaveAttribute(
      "href",
      publication.permalink,
    );
  });
});
