import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mercadoLibreGetConnection: vi.fn(),
  tiendanubeGetConnection: vi.fn(),
  tiendaNegocioGetConnection: vi.fn(),
}));

vi.mock("@/modules/integrations/integrations.composition.server", () => ({
  createMercadoLibreApiRepository: () => ({
    getConnection: mocks.mercadoLibreGetConnection,
  }),
  createTiendanubeApiRepository: () => ({
    getConnection: mocks.tiendanubeGetConnection,
  }),
  createTiendaNegocioApiRepository: () => ({
    getConnection: mocks.tiendaNegocioGetConnection,
  }),
}));

vi.mock("@/modules/integrations/presentation/integration-card.client", () => ({
  IntegrationCard: ({
    name,
    status,
    detail,
  }: {
    name: string;
    status: string;
    detail?: string | null;
  }) => <div>{`${name}|${status}|${detail ?? ""}`}</div>,
}));

vi.mock("@/shared/ui/page-header/page-header", () => ({
  PageHeader: () => null,
}));

vi.mock("./actions", () => ({
  disconnectMercadoLibre: vi.fn(),
  disconnectTiendanube: vi.fn(),
  disconnectTiendaNegocio: vi.fn(),
}));

import IntegrationsPage from "./page";

describe("IntegrationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tiendaNegocioGetConnection.mockResolvedValue({ connected: false, authorizationConfigured: true });
    mocks.tiendanubeGetConnection.mockResolvedValue({
      connected: true,
      storeId: "12345",
    });
  });

  it("mapea reconnectRequired y conserva el estado de Tiendanube", async () => {
    mocks.mercadoLibreGetConnection.mockResolvedValue({
      connected: false,
      reconnectRequired: true,
      sellerId: 639189394,
    });

    render(await IntegrationsPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByText(
        "Mercado Libre|reconnect-required|Seller ID: 639189394",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tiendanube|connected|Store ID: 12345"),
    ).toBeInTheDocument();
    expect(screen.getByText("Tienda Negocio|not-connected|")).toBeInTheDocument();
  });

  it("muestra el ID de Tienda Negocio cuando ya está autorizada", async () => {
    mocks.mercadoLibreGetConnection.mockResolvedValue({ connected: true, sellerId: 12 });
    mocks.tiendaNegocioGetConnection.mockResolvedValue({
      connected: true, storeId: "456", authorizationConfigured: true,
    });
    render(await IntegrationsPage({ searchParams: Promise.resolve({ tiendaNegocio: "connected" }) }));
    expect(screen.getByText("Tienda Negocio|connected|Store ID: 456")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Tienda Negocio se autorizó correctamente");
  });

  it("mapea un error inesperado de Mercado Libre como unknown", async () => {
    mocks.mercadoLibreGetConnection.mockRejectedValue(
      new Error("unexpected"),
    );

    render(await IntegrationsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Mercado Libre|unknown|")).toBeInTheDocument();
  });
});
