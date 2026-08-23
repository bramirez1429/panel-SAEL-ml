import { describe, expect, it } from "vitest";

import type { PublicationDetail } from "../domain/publication.model";
import { createPublicationVariantRows, getAttributeValue } from "./publication-variant-row";

const base: PublicationDetail = {
  id: "MLA100",
  title: "Publicación",
  channel: "MERCADO_LIBRE",
  status: "active",
  thumbnailUrl: null,
  permalink: null,
  price: { from: 1000, to: 1000, currency: "ARS" },
  stock: 3,
  sold: 2,
  attributes: [{ id: "COLOR", value: "Negro" }, { id: "SIZE", value: "M" }],
  group: {
    key: "family:1",
    type: "USER_PRODUCT",
    familyId: "1",
    userProductId: "UP-1",
    itemId: null,
    childrenCount: 1,
  },
  variants: [],
};

describe("publication variant rows", () => {
  it("maps only COLOR and SIZE attributes", () => {
    const rows = createPublicationVariantRows(base);
    expect(rows[0]).toMatchObject({ color: "Negro", size: "M" });
    expect(getAttributeValue([{ id: "SELLER_PACKAGE", value: "x" }], "COLOR")).toBeNull();
  });

  it("uses a main row when a legacy publication has no variations", () => {
    const rows = createPublicationVariantRows({
      ...base,
      group: { ...base.group, type: "LEGACY", familyId: null },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.publicationId).toBe("MLA100");
  });
});
