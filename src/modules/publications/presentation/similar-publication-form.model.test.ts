import { describe, expect, it } from "vitest";
import type { SimilarPublicationDraft } from "../domain/similar-publication.model";
import {
  buildSimilarPublicationInput,
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
});
