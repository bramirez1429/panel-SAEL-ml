import { describe, expect, it } from "vitest";

import type {
  SimilarPublicationVariant,
} from "../domain/similar-publication.model";
import type { SimilarPublicationFormValues, VariantPictures } from "./similar-publication-form.model";
import {
  createSimilarPublicationVariantCards,
  createSimilarPublicationVariantSummary,
} from "./similar-publication-variant-card.model";

const variants: readonly SimilarPublicationVariant[] = [
  createVariant("rose-6", "Rosa", "6", 3),
  createVariant("rose-8", "Rosa", "8", 5),
  createVariant("black-10", "Negro", "10", 2),
];

const values: SimilarPublicationFormValues = {
  publishToTiendanube: false,
  variants: Object.fromEntries(
    variants.map((variant) => [
      variant.sourceReference,
      { price: variant.price, stock: variant.stock, sku: `SKU-${variant.sourceReference}` },
    ]),
  ),
  attributes: Object.fromEntries(
    variants.map((variant) => [
      variant.sourceReference,
      Object.fromEntries(
        variant.attributes.map((attribute) => [attribute.id, attribute.valueName ?? ""]),
      ),
    ]),
  ),
};

const picturesByVariant: VariantPictures = {
  "rose-6": [{ id: "ROSE-1", secureUrl: "https://example.com/rose-1.jpg" }],
  "rose-8": [{ id: "ROSE-2", secureUrl: "https://example.com/rose-2.jpg" }],
  "black-10": [{ id: "BLACK-1", secureUrl: "https://example.com/black-1.jpg" }],
};

describe("similar publication visual variant cards", () => {
  it("groups real variants by COLOR and keeps all their sizes", () => {
    const cards = createSimilarPublicationVariantCards(
      variants,
      values,
      picturesByVariant,
      [],
    );
    const rose = cards.find(({ color }) => color === "Rosa");

    expect(cards).toHaveLength(2);
    expect(rose?.variants.map(({ size }) => size)).toEqual(["6", "8"]);
    expect(rose?.stockTotal).toBe(8);
  });

  it("does not mix specific pictures from Negro and Rosa", () => {
    const cards = createSimilarPublicationVariantCards(
      variants,
      values,
      picturesByVariant,
      [],
    );

    expect(cards.find(({ color }) => color === "Rosa")?.pictures.map(({ picture }) => picture.id)).toEqual([
      "ROSE-1",
      "ROSE-2",
    ]);
    expect(cards.find(({ color }) => color === "Negro")?.pictures.map(({ picture }) => picture.id)).toEqual([
      "BLACK-1",
    ]);
  });

  it("counts summary values from common and variant pictures without duplicates", () => {
    const commonPictures = [{ id: "COMMON-1", secureUrl: "https://example.com/common.jpg" }];
    const cards = createSimilarPublicationVariantCards(
      variants,
      values,
      picturesByVariant,
      commonPictures,
    );

    expect(createSimilarPublicationVariantSummary(cards, commonPictures)).toEqual({
      colors: 2,
      variants: 3,
      pictures: 4,
      units: 10,
    });
  });

  it("uses common pictures to complete a color without specific pictures", () => {
    const cards = createSimilarPublicationVariantCards(
      [createVariant("white-12", "Blanco", "12", 4)],
      {
        ...values,
        variants: { "white-12": { price: 100, stock: 4, sku: "SKU-WHITE" } },
        attributes: { "white-12": { COLOR: "Blanco", SIZE: "12" } },
      },
      {},
      [{ id: "COMMON-1", secureUrl: "https://example.com/common.jpg" }],
    );

    expect(cards[0]).toMatchObject({ complete: true, pictures: [] });
  });

  it("uses edited COLOR values and keeps pictures tied to sourceReference", () => {
    const cards = createSimilarPublicationVariantCards(
      variants,
      {
        ...values,
        attributes: {
          ...values.attributes,
          "rose-6": { COLOR: "Fucsia", SIZE: "6" },
        },
      },
      picturesByVariant,
      [],
    );

    const fuchsia = cards.find(({ color }) => color === "Fucsia");
    expect(fuchsia?.pictures[0]).toMatchObject({
      sourceReference: "rose-6",
      picture: { id: "ROSE-1" },
    });
  });
});

function createVariant(
  sourceReference: string,
  color: string,
  size: string,
  stock: number,
): SimilarPublicationVariant {
  return {
    sourceReference,
    price: 100,
    stock,
    sku: null,
    pictureIds: [],
    attributes: [
      { id: "COLOR", name: "Color", valueId: null, valueName: color, values: [] },
      { id: "SIZE", name: "Talle", valueId: null, valueName: size, values: [] },
    ],
  };
}
