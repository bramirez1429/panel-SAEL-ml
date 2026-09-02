import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "antd";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SimilarPublicationVariant } from "../domain/similar-publication.model";
import { SimilarPublicationVariantCard } from "./similar-publication-variant-card.client";
import type { SimilarPublicationVariantCard as CardModel } from "./similar-publication-variant-card.model";

const original = variant("variant:6", "6");

describe("SimilarPublicationVariantCard sizes", () => {
  afterEach(cleanup);

  it("offers only missing children sizes", async () => {
    const user = userEvent.setup();
    const onAddSize = vi.fn();
    renderCard(card([original]), onAddSize);

    await user.click(
      screen.getByLabelText("Agregar talle"),
    );

    expect(screen.queryByText("Talle 6")).not.toBeInTheDocument();
    expect(await screen.findByText("Talle 8")).toBeInTheDocument();
    await user.click(screen.getByText("Talle 8"));
    expect(onAddSize).toHaveBeenCalledWith([original], "8");
  });

  it("allows removing any size when another size remains", async () => {
    const user = userEvent.setup();
    const added = variant("added-size:variant%3A6:8", "8");
    const onRemoveVariant = vi.fn();
    renderCard(card([original, added]), vi.fn(), onRemoveVariant);

    await user.click(
      screen.getByRole("button", {
        name: "Eliminar talle 6",
      }),
    );

    expect(onRemoveVariant).toHaveBeenCalledWith(
      original.sourceReference,
    );
  });
});

function renderCard(
  model: CardModel,
  onAddSize: (
    variants: readonly SimilarPublicationVariant[],
    size: string,
  ) => void,
  onRemoveVariant: (sourceReference: string) => void = vi.fn(),
) {
  render(
    <Form initialValues={{
      variants: Object.fromEntries(
        model.variants.map(({ sourceReference }) => [
          sourceReference,
          { price: 100, stock: 0, sku: "" },
        ]),
      ),
      attributes: Object.fromEntries(
        model.variants.map(({ sourceReference, size }) => [
          sourceReference,
          { COLOR: "Rosa", SIZE: size ?? "" },
        ]),
      ),
    }}>
      <SimilarPublicationVariantCard
      canRemoveColor={false}
      card={model}
      formValues={{
        publishToTiendanube: false,
        variants: Object.fromEntries(
          model.variants.map(({ sourceReference }) => [
            sourceReference,
            { price: 100, stock: 0, sku: "" },
          ]),
        ),
        attributes: Object.fromEntries(
          model.variants.map(({ sourceReference, size }) => [
            sourceReference,
            { COLOR: "Rosa", SIZE: size ?? "" },
          ]),
        ),
      }}
      onAddSize={onAddSize}
      onPicturesChange={vi.fn()}
      onRemoveColor={vi.fn()}
      onRemoveVariant={onRemoveVariant}
      onUploadingChange={vi.fn()}
      picturesByVariant={{}}
      showPriceColumn={false}
      uploadAction={vi.fn()}
      />
    </Form>,
  );
}

function card(variants: readonly SimilarPublicationVariant[]): CardModel {
  return {
    key: "color:rosa",
    color: "Rosa",
    pictures: [],
    variants: variants.map((item) => ({
      sourceReference: item.sourceReference,
      variant: item,
      color: "Rosa",
      size: item.attributes.find(({ id }) => id === "SIZE")?.valueName ?? null,
      stock: 0,
      sku: "",
      price: 100,
    })),
    stockTotal: 0,
    complete: false,
    commonPicturesCount: 0,
  };
}

function variant(sourceReference: string, size: string): SimilarPublicationVariant {
  return {
    sourceReference,
    price: 100,
    stock: 0,
    sku: null,
    pictureIds: [],
    attributes: [
      { id: "COLOR", name: "Color", valueId: null, valueName: "Rosa", values: [] },
      { id: "SIZE", name: "Talle", valueId: null, valueName: size, values: [] },
    ],
  };
}
