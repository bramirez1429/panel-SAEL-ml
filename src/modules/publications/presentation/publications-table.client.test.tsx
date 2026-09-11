import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PublicationsPage } from "../domain/publication.model";
import { PublicationsTable } from "./publications-table.client";

const navigation = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  searchParams: new URLSearchParams(
    "page=1&cursor=&search=campera&type=LEGACY&status=active",
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
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
  publications: [{
    id: "publication/id",
    title: "Publicación real",
    channel: "MERCADO_LIBRE",
    status: "active",
    thumbnailUrl: "https://example.com/thumb.jpg",
    permalink: null,
    price: { from: 1000, to: 1250, currency: null },
    stock: 4,
    sold: 3,
    attributes: [],
    group: {
      key: "item:MLA1",
      productId: "123e4567-e89b-42d3-a456-426614174000",
      type: "LEGACY",
      familyId: null,
      userProductId: null,
      itemId: "MLA1",
      childrenCount: 0,
    },
  }],
  count: 1,
};

describe("PublicationsTable", () => {
  afterEach(() => {
    cleanup();
    navigation.back.mockReset();
    navigation.push.mockReset();
    navigation.refresh.mockReset();
    sessionStorage.clear();
  });

  it("uses the backend cursor for the next page while preserving filters", async () => {
    const user = userEvent.setup();
    render(<PublicationsTable page={pageWithPublication} />);
    await user.click(screen.getByTitle("2"));
    expect(navigation.push).toHaveBeenCalledWith(
      "/publicaciones?page=2&cursor=cursor-2&search=campera&type=LEGACY&status=active",
    );
  });

  it("shows the three-dot actions with preserved detail and similar URLs", async () => {
    const user = userEvent.setup();
    render(<PublicationsTable page={pageWithPublication} />);
    await user.click(screen.getByRole("button", { name: "Acciones de Publicación real" }));

    expect(screen.getByRole("link", { name: "Ver detalle / editar" })).toHaveAttribute(
      "href",
      "/publicaciones/publication%2Fid?returnTo=%2Fpublicaciones%3Fpage%3D1%26cursor%3D%26search%3Dcampera%26type%3DLEGACY%26status%3Dactive",
    );
    expect(screen.getByRole("link", { name: "Publicar similar" })).toHaveAttribute(
      "href",
      "/publicaciones/similar?sourceKey=item%3AMLA1&returnTo=%2Fpublicaciones%3Fpage%3D1%26cursor%3D%26search%3Dcampera%26type%3DLEGACY%26status%3Dactive",
    );
  });

  it("renders real grouped publication fields in the Ant Design table", () => {
    render(<PublicationsTable page={pageWithPublication} />);
    expect(screen.getByRole("region", { name: "Tabla de publicaciones" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Volver a replicar" })).not.toBeInTheDocument();
    expect(screen.getByText("Publicación real")).toBeInTheDocument();
    expect(screen.getByText("Mercado Libre")).toBeInTheDocument();
    expect(screen.getByText("Activa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copiar MLA MLA1" })).toBeInTheDocument();
    expect(screen.getByText("1.000 — 1.250")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Imagen de Publicación real" })).toBeInTheDocument();
  });

  it("renders a clean placeholder when thumbnail is missing", () => {
    render(<PublicationsTable page={{
      ...pageWithPublication,
      publications: [{ ...pageWithPublication.publications[0]!, thumbnailUrl: null }],
    }} />);
    expect(screen.getByTitle("Imagen no disponible")).toBeInTheDocument();
  });

  it("muestra siempre las variantes USER_PRODUCT, sus IDs copiables y sin expandir", () => {
    const family = {
      ...pageWithPublication.publications[0]!,
      group: { ...pageWithPublication.publications[0]!.group, type: "USER_PRODUCT" as const, familyId: "FAMILY-1", childrenCount: 1 },
      variants: [
        { id: "UP-1:MLA2", itemId: "MLA2", userProductId: "UP-1", label: null, title: "Talle 42", thumbnailUrl: null, status: "active", price: { amount: 1000, currency: null }, stock: 8, sold: 0, sku: "SKU-42", attributes: [{ id: "SIZE", value: "42" }], permalink: null },
        { id: "UP-1:MLA3", itemId: "MLA3", userProductId: "UP-1", label: null, title: "Talle 42", thumbnailUrl: null, status: "active", price: { amount: 1000, currency: null }, stock: 8, sold: 0, sku: "SKU-42", attributes: [{ id: "SIZE", value: "42" }], permalink: null },
      ],
    };
    const { container } = render(<PublicationsTable page={{ ...pageWithPublication, publications: [family] }} updateAction={vi.fn()} />);

    expect(container.querySelector(".ant-table-row-expand-icon")).not.toBeInTheDocument();
    expect(container.querySelector('[aria-label="Variantes de Publicación real"]')).toBeInTheDocument();
    expect(screen.getAllByText("42")).toHaveLength(1);
    expect(screen.getByRole("spinbutton", { name: "Stock de 42" })).toHaveValue("8");
    expect(container.querySelector('[aria-label="Copiar Family ID FAMILY-1"]')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Copiar MLA MLA2"]')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Copiar MLA MLA3"]')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Copiar MLAU UP-1"]')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-label="Copiar SKU SKU-42"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar variante 42" })).toBeDisabled();
    const identity = container.querySelector("aside");
    expect(identity).not.toHaveTextContent("MLA2");
    expect(identity).not.toHaveTextContent("MLA3");
    expect(identity).not.toHaveTextContent("UP-1");
  });

  it("replica usando group.key y no IDs internos", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, action: "created" as const });
    const user = userEvent.setup();
    render(<PublicationsTable page={pageWithPublication} replicateAction={action} />);
    await user.click(screen.getByRole("button", { name: "Replicar TN" }));
    expect(action).not.toHaveBeenCalled();
    expect(action).not.toHaveBeenCalledWith("123e4567-e89b-42d3-a456-426614174000");
  });

  it("muestra variantes clásicas con stock individual", () => {
    const legacy = { ...pageWithPublication.publications[0]!, variants: [{ id: "987", itemId: null, userProductId: null, label: null, title: null, thumbnailUrl: null, status: null, price: { amount: 1200, currency: "ARS" }, stock: 6, sold: 2, sku: "SKU-M", attributes: [{ id: "COLOR", value: "Negro" }, { id: "SIZE", value: "M" }], permalink: null }] };
    render(<PublicationsTable page={{ ...pageWithPublication, publications: [legacy] }} updateAction={vi.fn()} />);
    expect(screen.getByRole("table", { name: "Variantes de Publicación real" })).toBeInTheDocument();
    expect(screen.getByText("Negro / M")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Stock de M" })).toHaveValue("6");
  });

  it("elimina una variante clásica por sus IDs reales y refresca después del backend", async () => {
    const user = userEvent.setup();
    let resolveDelete: ((value: { ok: true }) => void) | undefined;
    const deleteVariationAction = vi.fn(() => new Promise<{ ok: true }>((resolve) => { resolveDelete = resolve; }));
    const legacy = {
      ...pageWithPublication.publications[0]!,
      status: "closed",
      variants: [{ id: "987", itemId: "MLA1", userProductId: null, label: null, title: null, thumbnailUrl: null, status: "closed", price: { amount: 1200, currency: "ARS" }, stock: 0, sold: 2, sku: "SKU-38", attributes: [{ id: "COLOR", value: "Crema" }, { id: "SIZE", value: "38" }], permalink: null }],
    };
    render(<PublicationsTable page={{ ...pageWithPublication, publications: [legacy] }} updateAction={vi.fn()} deleteVariationAction={deleteVariationAction} />);

    const trash = screen.getByRole("button", { name: "Eliminar variante Crema / 38" });
    expect(trash).toBeEnabled();
    await user.click(trash);
    expect(screen.getByRole("dialog")).toHaveTextContent("¿Estás seguro de borrar el talle 38?");
    expect(screen.getByRole("dialog")).toHaveTextContent("Color: Crema");

    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(deleteVariationAction).toHaveBeenCalledWith({ publicationId: "publication/id", publicationType: "LEGACY", itemId: "MLA1", variationId: 987 });
    expect(screen.getByText("Crema / 38")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Eliminando/ })).toBeDisabled();
    expect(navigation.refresh).not.toHaveBeenCalled();

    resolveDelete?.({ ok: true });
    await waitFor(() => expect(navigation.refresh).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Talle eliminado correctamente")).toBeInTheDocument();
  });

  it("conserva la fila y muestra el mensaje del backend cuando falla", async () => {
    const user = userEvent.setup();
    const deleteVariationAction = vi.fn().mockResolvedValue({ ok: false, message: "Mercado Libre no permite eliminar esta variante" });
    const legacy = { ...pageWithPublication.publications[0]!, variants: [{ id: "456", itemId: "MLA1", userProductId: null, label: null, title: null, thumbnailUrl: null, status: "active", price: null, stock: 5, sold: 0, sku: null, attributes: [{ id: "COLOR", value: "Negro" }, { id: "SIZE", value: "46" }], permalink: null }] };
    render(<PublicationsTable page={{ ...pageWithPublication, publications: [legacy] }} updateAction={vi.fn()} deleteVariationAction={deleteVariationAction} />);

    await user.click(screen.getByRole("button", { name: "Eliminar variante Negro / 46" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("Mercado Libre no permite eliminar esta variante")).toBeInTheDocument();
    expect(screen.getByText("Negro / 46")).toBeInTheDocument();
    expect(navigation.refresh).not.toHaveBeenCalled();
  });
});
