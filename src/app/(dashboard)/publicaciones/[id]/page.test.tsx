import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { ApiError } from "@/shared/api/api-error";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND_TEST");
  }),
}));

vi.mock("@/modules/publications/publications.composition.server", () => ({
  createGetPublicationByIdQuery: () => ({ execute: mocks.execute }),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

import PublicationDetailPage from "./page";

describe("PublicationDetailPage", () => {
  beforeEach(() => {
    cleanup();
    mocks.execute.mockReset();
    mocks.notFound.mockClear();
  });

  it("uses notFound for a real API 404", async () => {
    mocks.execute.mockRejectedValue(
      new ApiError("Publicación no encontrada.", "API_HTTP_ERROR", {
        status: 404,
      }),
    );

    await expect(
      PublicationDetailPage({
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND_TEST");

    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("accepts the listing return URL without changing the server flow", async () => {
    mocks.execute.mockResolvedValue({
      id: "MLA100",
      title: "Publicación",
      channel: "MERCADO_LIBRE",
      status: "active",
      thumbnailUrl: null,
      permalink: null,
      price: null,
      stock: 1,
      sold: 0,
      attributes: [],
      group: {
        key: "item:MLA100",
        type: "LEGACY",
        familyId: null,
        userProductId: null,
        itemId: "MLA100",
        childrenCount: 0,
      },
      variants: [],
    });

    const result = await PublicationDetailPage({
      params: Promise.resolve({ id: "MLA100" }),
      searchParams: Promise.resolve({
        returnTo: "/publicaciones?page=2&cursor=cursor-2",
      }),
    });

    render(result);
    expect(screen.getByRole("link", { name: /Volver/ })).toHaveAttribute(
      "href",
      "/publicaciones?page=2&cursor=cursor-2",
    );
  });

  it.each([
    new ApiError("El identificador no es válido.", "API_HTTP_ERROR", {
      status: 400,
    }),
    new ApiError("No se pudo conectar con el backend.", "API_UNREACHABLE"),
    new ApiError("La respuesta no es válida.", "API_INVALID_RESPONSE"),
  ])("renders %s instead of turning it into not-found", async (error) => {
    mocks.execute.mockRejectedValue(error);

    const result = await PublicationDetailPage({
      params: Promise.resolve({ id: "invalid-id" }),
    });
    render(result);

    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      `${error.message} Código: ${error.code}.`,
    );
  });
});
