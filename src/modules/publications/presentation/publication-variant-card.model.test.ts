import { describe, expect, it } from "vitest";

import type { PublicationDetail, PublicationVariant } from "../domain/publication.model";
import {
  createPublicationVariantCards,
  createPublicationVariantSummary,
} from "./publication-variant-card.model";

const variants: readonly PublicationVariant[] = [
  createVariant("1", "Rosa", "6", 3, [
    { id: "ROSA-1", url: "https://example.com/rosa-1.jpg" },
    { id: "ROSA-2", url: "https://example.com/rosa-2.jpg" },
  ]),
  createVariant("2", "Rosa", "8", 5, [
    { id: "ROSA-1", url: "https://example.com/rosa-1.jpg" },
  ]),
  createVariant("3", "Negro", "10", 2, [
    { id: "NEGRO-1", url: "https://example.com/negro-1.jpg" },
  ]),
];

const detail: PublicationDetail = {
  id: "MLA100",
  title: "Remera",
  channel: "MERCADO_LIBRE",
  status: "active",
  thumbnailUrl: null,
  pictures: [],
  permalink: null,
  price: { from: 1000, to: 1200, currency: "ARS" },
  stock: 10,
  sold: 0,
  attributes: [],
  group: {
    key: "family:200",
    type: "USER_PRODUCT",
    familyId: "200",
    userProductId: null,
    itemId: null,
    childrenCount: 3,
  },
  variants,
};

describe("publication visual variants", () => {
  it("groups offers by their real color and keeps every size", () => {
    const cards = createPublicationVariantCards(detail);
    const pink = cards.find(({ color }) => color === "Rosa");

    expect(cards).toHaveLength(2);
    expect(pink?.offers.map(({ size }) => size)).toEqual(["6", "8"]);
    expect(pink?.stockTotal).toBe(8);
  });

  it("keeps every distinct picture encapsulated in its color", () => {
    const pink = createPublicationVariantCards(detail).find(
      ({ color }) => color === "Rosa",
    );

    expect(pink?.pictures.map(({ id }) => id)).toEqual(["ROSA-1", "ROSA-2"]);
  });

  it("calculates the summary from grouped real data", () => {
    const summary = createPublicationVariantSummary(
      createPublicationVariantCards(detail),
    );

    expect(summary).toEqual({ colors: 2, variants: 3, images: 3, units: 10 });
  });

  it("keeps an explicit empty pictures fallback", () => {
    const cards = createPublicationVariantCards({
      ...detail,
      group: { ...detail.group, type: "LEGACY", familyId: null, itemId: "MLA100" },
      pictures: [],
      variants: [],
    });

    expect(cards[0]?.pictures).toEqual([]);
    expect(cards[0]?.complete).toBe(false);
  });
});

function createVariant(
  id: string,
  color: string,
  size: string,
  stock: number,
  pictures: PublicationVariant["pictures"],
): PublicationVariant {
  return {
    id,
    itemId: `MLA${id}`,
    userProductId: `UP-${id}`,
    label: null,
    title: null,
    thumbnailUrl: pictures[0]?.url ?? null,
    pictures,
    status: "active",
    price: { amount: 1000 + Number(id) * 100, currency: "ARS" },
    stock,
    sold: 0,
    sku: `SKU-${id}`,
    attributes: [
      { id: "COLOR", value: color },
      { id: "SIZE", value: size },
    ],
    permalink: null,
  };
}
