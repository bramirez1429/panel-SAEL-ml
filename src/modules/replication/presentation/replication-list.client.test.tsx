import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReplicablePublication, ReplicationVisitsProduct } from "../domain/replication.model";
import { ReplicationListClient } from "./replication-list.client";

const navigation = vi.hoisted(() => ({ search: "", push: vi.fn() }));
const observer = vi.hoisted(() => ({ callback: undefined as undefined | IntersectionObserverCallback }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

vi.mock("@/shared/ui/mercadolibre-publication-search.client", () => ({
  MercadoLibrePublicationSearch: () => <div data-testid="replication-search" />,
}));

vi.mock("@/modules/tiendanube/presentation/tiendanube-replication-modal.client", () => ({
  TiendanubeReplicationModal: () => null,
}));

vi.mock("@/shared/ui/copyable-text.client", () => ({
  CopyableText: ({ label }: Readonly<{ label: string }>) => <span>{label}</span>,
}));

class TestIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observer.callback = callback;
  }

  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
  root = null;
  rootMargin = "";
  thresholds = [];
}

Object.defineProperty(window, "IntersectionObserver", { writable: true, value: TestIntersectionObserver });

const visitsAction = vi.fn(async (products: readonly ReplicationVisitsProduct[]) => ({
  ok: true as const,
  items: products.map(({ sourceKey }) => ({ sourceKey, visits: 1234 })),
}));

function publication(index: number, overrides: Partial<ReplicablePublication> = {}): ReplicablePublication {
  return {
    sourceKey: `item:MLA${index}`,
    title: `Producto ${index}`,
    sold: 0,
    itemIds: [`MLA${index}`],
    priceFrom: null,
    priceTo: null,
    currency: null,
    thumbnailUrl: null,
    familyId: `1234567890${index}`,
    itemId: `MLA${index}`,
    userProductId: `MLAU${index}`,
    type: "LEGACY",
    ...overrides,
  };
}

function renderList(publications: readonly ReplicablePublication[]) {
  return render(<ReplicationListClient
    publications={publications}
    replicateAction={vi.fn()}
    loadPreviewAction={vi.fn()}
    loadCategoriesAction={vi.fn()}
    loadVisitsAction={visitsAction}
  />);
}

describe("ReplicationListClient search", () => {
  afterEach(() => {
    cleanup();
    navigation.search = "";
    visitsAction.mockClear();
    observer.callback = undefined;
    vi.useRealTimers();
  });

  it("filtra por título", () => {
    navigation.search = "search=Camisa";
    renderList([publication(1, { title: "Camisa azul" }), publication(2, { title: "Pantalón" })]);

    expect(screen.getByText("Camisa azul")).toBeInTheDocument();
    expect(screen.queryByText("Pantalón")).not.toBeInTheDocument();
  });

  it("filtra por MLA", () => {
    navigation.search = "search=MLA2";
    renderList([publication(1), publication(2)]);

    expect(screen.getByText("Producto 2")).toBeInTheDocument();
    expect(screen.queryByText("Producto 1")).not.toBeInTheDocument();
  });

  it("filtra por MLAU", () => {
    navigation.search = "search=MLAU2";
    renderList([publication(1), publication(2)]);

    expect(screen.getByText("Producto 2")).toBeInTheDocument();
    expect(screen.queryByText("Producto 1")).not.toBeInTheDocument();
  });

  it("filtra por Family ID", () => {
    navigation.search = "search=12345678902";
    renderList([publication(1), publication(2)]);

    expect(screen.getByText("Producto 2")).toBeInTheDocument();
    expect(screen.queryByText("Producto 1")).not.toBeInTheDocument();
  });

  it("vuelve a mostrar solo las primeras 20 cards al cambiar la búsqueda", () => {
    vi.useFakeTimers();
    const publications = Array.from({ length: 40 }, (_, index) => publication(index + 1));
    const view = renderList(publications);

    act(() => observer.callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    act(() => vi.advanceTimersByTime(120));
    expect(screen.getByText("Producto 21")).toBeInTheDocument();

    navigation.search = "search=Producto";
    view.rerender(<ReplicationListClient
      publications={publications}
      replicateAction={vi.fn()}
      loadPreviewAction={vi.fn()}
      loadCategoriesAction={vi.fn()}
      loadVisitsAction={visitsAction}
    />);

    expect(screen.queryByText("Producto 21")).not.toBeInTheDocument();
    expect(screen.getByText("Producto 20")).toBeInTheDocument();
  });
});
