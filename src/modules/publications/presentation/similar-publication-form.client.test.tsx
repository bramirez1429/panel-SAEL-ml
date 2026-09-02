import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SimilarPublicationDraft } from "../domain/similar-publication.model";
import { SimilarPublicationForm } from "./similar-publication-form.client";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

const draft: SimilarPublicationDraft = {
  sourceKey: "family:123",
  sourceType: "USER_PRODUCT",
  categoryId: "MLA1",
  familyName: "Familia original",
  titleTemplate: "Título original",
  description: "Descripción",
  currencyId: "ARS",
  listingTypeId: "gold_special",
  buyingMode: "buy_it_now",
  saleTerms: [],
  shipping: null,
  channels: ["marketplace"],
  pictures: [],
  variants: [{
    sourceReference: "variant:1",
    price: 100,
    stock: 2,
    sku: null,
    pictureIds: [],
    attributes: [{ id: "GTIN", name: "GTIN", valueId: null, valueName: null, values: [] }],
  }],
};

function actions() {
  return {
    uploadAction: vi.fn().mockResolvedValue({
      ok: true as const,
      picture: { id: "NEW-1", secureUrl: "https://new.example/picture.jpg" },
    }),
    createAction: vi.fn().mockResolvedValue({
      ok: true as const,
      result: {
        status: "SUCCESS" as const,
        newSourceKey: "family:999",
        items: [{
          variantKey: "variant:1",
          status: "CREATED" as const,
          itemId: "MLA999",
          userProductId: "UP999",
          familyId: "999",
          error: null,
        }],
      },
    }),
    replicateAction: vi.fn().mockResolvedValue({ ok: true as const, action: "created" as const }),
  };
}

function renderForm(overrides = actions()) {
  render(
    <SimilarPublicationForm
      categories={[{ id: 7, name: "Remeras", parentId: null }]}
      createAction={overrides.createAction}
      draft={draft}
      replicateAction={overrides.replicateAction}
      returnTo="/publicaciones?page=2"
      uploadAction={overrides.uploadAction}
    />,
  );
  return overrides;
}

async function prepareRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  const family = screen.getByLabelText("Nombre de familia");
  await user.clear(family);
  await user.type(family, "Familia nueva");
  const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
  expect(fileInput).not.toBeNull();
  await user.upload(fileInput!, new File(["new"], "new.jpg", { type: "image/jpeg" }));
  await waitFor(() => expect(screen.getByText("Imagen subida.")).toBeInTheDocument());
}

async function confirmPublication(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole("button", { name: "Crear publicación nueva" }),
  );
}

describe("SimilarPublicationForm", () => {
  afterEach(() => {
    cleanup();
    navigation.push.mockReset();
  });

  it("renders an editable USER_PRODUCT draft with empty new photos, SKU and GTIN", () => {
    renderForm();

    expect(screen.getByLabelText("Nombre de familia")).toHaveValue("Familia original");
    expect(screen.getByText("Mercado Libre generará el título final.")).toBeInTheDocument();
    expect(screen.getByLabelText("GTIN")).toHaveValue("");
    expect(screen.getByLabelText("SKU nuevo variant:1")).toHaveValue("");
    expect(document.querySelector('img[src*="original"]')).not.toBeInTheDocument();
  });

  it("uploads through the provided backend action and publishes once", async () => {
    const user = userEvent.setup();
    const current = renderForm();
    await prepareRequiredFields(user);

    await user.click(screen.getByRole("button", { name: "Publicar" }));
    await confirmPublication(user);

    await waitFor(() => expect(current.createAction).toHaveBeenCalledTimes(1));
    expect(current.uploadAction).toHaveBeenCalledTimes(1);
    expect(current.createAction).toHaveBeenCalledWith(expect.objectContaining({
      sourceKey: "family:123",
      familyName: "Familia nueva",
      pictures: [],
      variants: [
        expect.objectContaining({
          sourceReference: "variant:1",
          pictureIds: ["NEW-1"],
        }),
      ],
    }));
  });

  it("creates Mercado Libre first and replicates only the new sourceKey", async () => {
    const user = userEvent.setup();
    const current = renderForm();
    await prepareRequiredFields(user);
    await user.click(screen.getByText("Tienda Nube"));
    const category = await screen.findByRole("combobox", { name: "Categoría de Tienda Nube" });
    fireEvent.mouseDown(category);
    await user.click(await screen.findByText("Remeras"));

    await user.click(screen.getByRole("button", { name: "Publicar" }));
    await confirmPublication(user);

    await waitFor(() => expect(current.replicateAction).toHaveBeenCalledTimes(1));
    expect(current.createAction.mock.invocationCallOrder[0]).toBeLessThan(
      current.replicateAction.mock.invocationCallOrder[0] ?? Infinity,
    );
    expect(current.replicateAction).toHaveBeenCalledWith(
      "family:999",
      { priceMode: "KEEP_SOURCE", tagMode: "KEEP_SOURCE", categoryId: 7 },
    );
    expect(current.replicateAction).not.toHaveBeenCalledWith("family:123", expect.anything());
  });

  it("cancels without writes and returns to the exact list", async () => {
    const user = userEvent.setup();
    const current = renderForm();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(navigation.push).toHaveBeenCalledWith("/publicaciones?page=2");
    expect(current.createAction).not.toHaveBeenCalled();
    expect(current.replicateAction).not.toHaveBeenCalled();
  });

  it("blocks a duplicate submit while Mercado Libre is still creating", async () => {
    const user = userEvent.setup();
    const current = actions();
    let finish: ((value: Awaited<ReturnType<typeof current.createAction>>) => void) | undefined;
    current.createAction.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    renderForm(current);
    await prepareRequiredFields(user);
    const publish = screen.getByRole("button", { name: "Publicar" });

    fireEvent.click(publish);
    fireEvent.click(publish);
    await confirmPublication(user);
    await waitFor(() => expect(current.createAction).toHaveBeenCalledTimes(1));
    finish?.({
      ok: true,
      result: { status: "SUCCESS", newSourceKey: "family:999", items: [] },
    });
  });

  it("retries only Tienda Nube with the new sourceKey after a replication failure", async () => {
    const user = userEvent.setup();
    const current = actions();
    current.replicateAction
      .mockResolvedValueOnce({ ok: false, message: "Tienda Nube no respondió." })
      .mockResolvedValueOnce({ ok: true, action: "created" });
    renderForm(current);
    await prepareRequiredFields(user);
    await user.click(screen.getByText("Tienda Nube"));
    const category = await screen.findByRole("combobox", { name: "Categoría de Tienda Nube" });
    fireEvent.mouseDown(category);
    await user.click(await screen.findByText("Remeras"));
    await user.click(screen.getByRole("button", { name: "Publicar" }));
    await confirmPublication(user);

    expect(await screen.findByText("Tienda Nube no respondió.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar Tienda Nube" }));

    await waitFor(() => expect(current.replicateAction).toHaveBeenCalledTimes(2));
    expect(current.createAction).toHaveBeenCalledTimes(1);
    expect(current.replicateAction).toHaveBeenLastCalledWith(
      "family:999",
      { priceMode: "KEEP_SOURCE", tagMode: "KEEP_SOURCE", categoryId: 7 },
    );
  });
});
