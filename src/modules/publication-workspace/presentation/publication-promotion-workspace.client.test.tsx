import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";

import type { PublicationWorkspaceItem } from "../domain/publication-workspace.model";
import { PublicationPromotionWorkspace } from "./publication-promotion-workspace.client";

afterEach(cleanup);

const child = (itemId: string, status: string): PublicationWorkspaceItem => ({
  imageUrl: null, thumbnailUrl: null, title: `Remera ${itemId}`, itemId,
  familyId: "456", model: "VARIANT_PRICING", sku: `SKU-${itemId}`,
  status, stock: itemId === "MLA1" ? 4 : 2, price: 19990, currency: "ARS",
});

const successfulSave = vi.fn().mockResolvedValue({ ok: true, confirmed: {} });
const successfulStatus = vi.fn().mockResolvedValue({ ok: true, confirmed: "active" });
const successfulTitle = vi.fn().mockImplementation(async ({ title }) => ({ ok: true, title }));

describe("PublicationPromotionWorkspace", () => {
  it("no hace requests con una búsqueda vacía", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onSelect = vi.fn();
    renderWorkspace(onSearch, onSelect);
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    expect(onSearch).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("muestra estado vacío sin convertirlo en error", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn().mockResolvedValue({
      status: "success",
      searchType: "TITLE",
      query: "Sin resultados",
      items: [],
    });
    renderWorkspace(onSearch, vi.fn());

    await search(user, "Sin resultados");

    expect(
      await screen.findByText("No encontramos publicaciones."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No pudimos consultar la publicación."),
    ).not.toBeInTheDocument();
  });

  it("muestra estado de error cuando la API falla realmente", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn().mockRejectedValue(new Error("API unavailable"));
    renderWorkspace(onSearch, vi.fn());

    await search(user, "Remera");

    expect(
      await screen.findByText("No pudimos consultar la publicación."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No encontramos publicaciones."),
    ).not.toBeInTheDocument();
  });

  it("muestra todos los MLA hijos con campos editables y el switch correcto", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn().mockResolvedValue({
      status: "success", searchType: "FAMILY", query: "456",
      items: [
        { itemId: "MLA1", familyId: "456", userProductId: "MLAU1", title: "Remera MLA1", imageUrl: null, price: 1, currency: "ARS", status: "active", stock: 4 },
        { itemId: "MLA2", familyId: "456", userProductId: "MLAU2", title: "Remera MLA2", imageUrl: null, price: 1, currency: "ARS", status: "active", stock: 2 },
      ],
    });
    const onSelect = vi.fn().mockResolvedValue({
      status: "success",
      selection: { type: "family", familyId: "456", familyName: "Remeras Miami", imageUrl: null, children: [child("MLA1", "active"), child("MLA2", "paused")] },
    });
    renderWorkspace(onSearch, onSelect);
    await search(user, "456");

    expect(onSelect).toHaveBeenCalledWith({ familyId: "456", itemIds: ["MLA1", "MLA2"] });
    expect(await screen.findByText("Publicaciones de la familia")).toBeInTheDocument();
    expect(screen.getByText("MLA1")).toBeInTheDocument();
    expect(screen.getByText("MLA2")).toBeInTheDocument();
    expect(screen.getByLabelText("SKU de MLA1")).toHaveValue("SKU-MLA1");
    expect(screen.getByLabelText("Stock de MLA1")).toHaveValue("4");
    expect(screen.getByText("Remera MLA1")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Estado de MLA1" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Estado de MLA2" })).not.toBeChecked();
  });

  it("una búsqueda por MLA muestra solamente esa publicación", async () => {
    const user = userEvent.setup();
    const publication = { ...child("MLA1", "active"), familyId: null, model: "SHARED" as const };
    const onSearch = vi.fn().mockResolvedValue({ status: "success", searchType: "MLA", query: "MLA1", items: [{ itemId: "MLA1", familyId: null, userProductId: null, title: publication.title, imageUrl: null, price: 1, currency: "ARS", status: "active", stock: 4 }] });
    const onSelect = vi.fn().mockResolvedValue({ status: "success", selection: { type: "publication", publication } });
    renderWorkspace(onSearch, onSelect);
    await search(user, "MLA1");

    expect(onSelect).toHaveBeenCalledWith({ itemId: "MLA1" });
    expect(await screen.findByText("MLA1")).toBeInTheDocument();
    expect(screen.queryByText("Publicaciones de la familia")).not.toBeInTheDocument();
  });

  it("la tab Promoción no dispara consultas adicionales", async () => {
    const user = userEvent.setup();
    const publication = { ...child("MLA1", "active"), familyId: null, model: "SHARED" as const };
    const onSearch = vi.fn().mockResolvedValue({ status: "success", searchType: "MLA", query: "MLA1", items: [{ itemId: "MLA1", familyId: null, userProductId: null, title: publication.title, imageUrl: null, price: 1, currency: "ARS", status: "active", stock: 4 }] });
    const onSelect = vi.fn().mockResolvedValue({ status: "success", selection: { type: "publication", publication } });
    renderWorkspace(onSearch, onSelect);
    await search(user, "MLA1");
    await user.click(await screen.findByRole("tab", { name: "Promoción" }));

    expect(screen.getByText("Las promociones todavía no están disponibles en este workspace.")).toBeInTheDocument();
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(successfulSave).not.toHaveBeenCalled();
    expect(successfulStatus).not.toHaveBeenCalled();
  });
});

type WorkspaceProps = ComponentProps<typeof PublicationPromotionWorkspace>;

function renderWorkspace(
  onSearch: WorkspaceProps["onSearch"],
  onSelect: WorkspaceProps["onSelect"],
) {
  successfulSave.mockClear();
  successfulStatus.mockClear();
  successfulTitle.mockClear();
  return render(<PublicationPromotionWorkspace onSearch={onSearch} onSelect={onSelect} onSave={successfulSave} onStatusChange={successfulStatus} onTitleSave={successfulTitle} />);
}

async function search(user: ReturnType<typeof userEvent.setup>, term: string) {
  await user.type(screen.getByPlaceholderText("Buscar por MLA, MLAU, Family ID o nombre"), term);
  await user.click(screen.getByRole("button", { name: "Buscar" }));
}
