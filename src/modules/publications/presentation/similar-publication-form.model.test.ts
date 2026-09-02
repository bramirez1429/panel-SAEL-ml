import { describe, expect, it } from "vitest";
import type { SimilarPublicationDraft } from "../domain/similar-publication.model";
import {
  availableChildrenSizes,
  buildSimilarPublicationInput,
  createAddedSizeVariant,
  createInitialSimilarPublicationValues,
  familyNameIsUnchanged,
} from "./similar-publication-form.model";

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
    stock: 3,
    sku: null,
    pictureIds: [],
    attributes: [
      { id: "COLOR", name: "Color", valueId: "BLACK", valueName: "Negro", values: [] },
      { id: "GTIN", name: "GTIN", valueId: null, valueName: null, values: [] },
    ],
  }],
};

describe("similar publication form model", () => {
  it("starts SKU, GTIN and pictures empty without inheriting originals", () => {
    const values = createInitialSimilarPublicationValues(draft);

    expect(values.variants["variant:1"]?.sku).toBe("");
    expect(values.attributes["variant:1"]?.GTIN).toBe("");
    expect(draft.pictures).toEqual([]);
  });

  it("keeps safe attributes and uses only newly uploaded picture IDs", () => {
    const values = createInitialSimilarPublicationValues(draft);
    values.familyName = "Familia nueva";
    const input = buildSimilarPublicationInput(
      draft,
      values,
      [{ id: "NEW-1", secureUrl: "https://new.example/1.jpg" }],
      {},
    );

    expect(input.sourceKey).toBe("family:123");
    expect(input.titleTemplate).toBeNull();
    expect(input.variants[0]?.pictureIds).toEqual(["NEW-1"]);
    expect(input.variants[0]?.sku).toBeNull();
    expect(input.variants[0]?.attributes.find(({ id }) => id === "GTIN")?.valueName).toBeNull();
  });

  it("rejects the original USER_PRODUCT family name case-insensitively", () => {
    expect(familyNameIsUnchanged(" familia ORIGINAL ", "Familia original")).toBe(true);
    expect(familyNameIsUnchanged("Familia nueva", "Familia original")).toBe(false);
  });

  it("adds only a missing children size and preserves technical attributes", () => {
    const template = {
      ...draft.variants[0]!,
      attributes: [
        ...draft.variants[0]!.attributes,
        { id: "SIZE", name: "Talle", valueId: "SIZE-6", valueName: "6", values: [] },
        { id: "TECHNICAL", name: "Ficha", valueId: "T-1", valueName: "Original", values: [] },
      ],
    };
    const added = createAddedSizeVariant(template, "8");

    expect(availableChildrenSizes([template], undefined)).toEqual(["8", "10", "12", "14"]);
    expect(added).toMatchObject({ stock: 0, sku: null, pictureIds: [] });
    expect(added.attributes.find(({ id }) => id === "SIZE")).toMatchObject({
      valueId: null,
      valueName: "8",
    });
    expect(added.attributes.find(({ id }) => id === "TECHNICAL")).toEqual(
      template.attributes.find(({ id }) => id === "TECHNICAL"),
    );
  });

  it("includes an added size in the create payload", () => {
    const template = {
      ...draft.variants[0]!,
      attributes: [
        ...draft.variants[0]!.attributes,
        { id: "SIZE", name: "Talle", valueId: "SIZE-6", valueName: "6", values: [] },
      ],
    };
    const added = createAddedSizeVariant(template, "8");
    const values = createInitialSimilarPublicationValues({ ...draft, variants: [template] });
    values.variants[added.sourceReference] = { price: 100, stock: 4, sku: "NEW-8" };
    values.attributes[added.sourceReference] = Object.fromEntries(
      added.attributes.map((attribute) => [attribute.id, attribute.valueName ?? ""]),
    );

    const input = buildSimilarPublicationInput(
      { ...draft, variants: [template] },
      values,
      [],
      { [added.sourceReference]: [{ id: "COLOR-1", secureUrl: "https://new/1.jpg" }] },
      [template, added],
    );

    expect(input.variants).toHaveLength(2);
    expect(input.variants[1]).toMatchObject({ stock: 4, sku: "NEW-8", pictureIds: ["COLOR-1"] });
  });
});
