import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicationWorkspaceItem } from "../domain/publication-workspace.model";
import { PublicationWorkspaceEditor } from "./publication-workspace-editor.client";

const publication: PublicationWorkspaceItem = {
  imageUrl: null,
  thumbnailUrl: null,
  title: "Remera original",
  itemId: "MLA2904936662",
  familyId: null,
  model: "SHARED",
  sku: "SKU-1",
  status: "active",
  stock: 12,
  price: 100,
  currency: "ARS",
};

const update = vi.fn(async (input) => ({
  ok: true as const,
  confirmed: { sku: input.draft.sku, stock: input.draft.stock },
}));
const updateStatus = vi.fn().mockResolvedValue({ ok: true, confirmed: "active" });
const updateTitle = vi.fn(async ({ title }) => ({ ok: true as const, title }));
const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  update.mockClear();
  updateStatus.mockClear();
  updateTitle.mockClear();
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});
afterEach(cleanup);

describe("PublicationWorkspaceEditor", () => {
  it("copia el MLA", async () => {
    const user = userEvent.setup();
    const clipboardWrite = vi.spyOn(navigator.clipboard, "writeText");
    renderEditor();
    await user.click(screen.getByRole("button", { name: "Copiar MLA MLA2904936662" }));
    expect(clipboardWrite).toHaveBeenCalledWith("MLA2904936662");
    expect(await screen.findByText("MLA copiado")).toBeInTheDocument();
  });

  it("guarda stock al salir del campo y no guarda si no cambió", async () => {
    renderEditor();
    const stock = screen.getByLabelText("Stock de MLA2904936662");
    fireEvent.blur(stock);
    expect(update).not.toHaveBeenCalled();

    fireEvent.change(stock, { target: { value: "8" } });
    fireEvent.blur(stock);
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0]?.[0].draft.stock).toBe(8);
  });

  it("guarda SKU al salir del campo y no guarda si no cambió", async () => {
    renderEditor();
    const sku = screen.getByLabelText("SKU de MLA2904936662");
    fireEvent.blur(sku);
    expect(update).not.toHaveBeenCalled();

    fireEvent.change(sku, { target: { value: "SKU-2" } });
    fireEvent.blur(sku);
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0]?.[0].draft.sku).toBe("SKU-2");
  });

  it("el lápiz habilita el título y onBlur lo guarda", async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole("button", { name: "Editar título" }));
    const title = screen.getByLabelText("Editar título");
    await user.clear(title);
    await user.type(title, "Remera nueva");
    fireEvent.blur(title);
    await waitFor(() => expect(updateTitle).toHaveBeenCalledWith({ target: { type: "publication", itemId: publication.itemId }, title: "Remera nueva" }));
    expect(await screen.findByText("Remera nueva")).toBeInTheDocument();
  });

  it("Enter guarda el título y Escape cancela sin request", async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole("button", { name: "Editar título" }));
    await user.clear(screen.getByLabelText("Editar título"));
    await user.type(screen.getByLabelText("Editar título"), "Título con Enter{Enter}");
    await waitFor(() => expect(updateTitle).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("button", { name: "Editar título" }));
    await user.clear(screen.getByLabelText("Editar título"));
    await user.type(screen.getByLabelText("Editar título"), "Cancelar{Escape}");
    expect(updateTitle).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Título con Enter")).toBeInTheDocument();
  });

  it("restaura el valor anterior cuando falla el autoguardado", async () => {
    update.mockResolvedValueOnce({ ok: false, message: "Falló", confirmed: {} } as never);
    renderEditor();
    const stock = screen.getByLabelText("Stock de MLA2904936662");
    fireEvent.change(stock, { target: { value: "3" } });
    fireEvent.blur(stock);
    await waitFor(() => expect(stock).toHaveValue("12"));
    expect(await screen.findByText("Falló")).toBeInTheDocument();
  });
});

function renderEditor() {
  return render(
    <PublicationWorkspaceEditor
      publication={publication}
      onSave={update}
      onStatusChange={updateStatus}
      onTitleSave={updateTitle}
      titleTarget={{ type: "publication", itemId: publication.itemId }}
    />,
  );
}
