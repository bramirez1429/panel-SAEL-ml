import { describe, expect, it } from "vitest";

import { getPublicationFormatLabel } from "./bulk-stock-format";
import { matchesBulkStockSearch, normalizeSearchText } from "./bulk-stock-search";
import type { BulkStockVariant } from "../domain/bulk-stock.model";

describe("bulk stock search", () => {
  it("normaliza mayúsculas, tildes y espacios", () => {
    expect(normalizeSearchText("  REMERA NIÑA  ")).toBe("remera nina");
  });

  it.each([
    ["Rosa", true],
    ["LEOPARDO", true],
    ["remera niña", true],
    ["MLA1491525989", true],
    ["183428567442", true],
    ["MLAU123", true],
    ["rosa 46", true],
    ["azul 46", false],
  ])("busca por %s", (query, expected) => {
    expect(matchesBulkStockSearch(variant, query)).toBe(expected);
  });
});

describe("bulk stock publication format", () => {
  it("traduce sólo la representación visual del modelo", () => {
    expect(getPublicationFormatLabel("LEGACY")).toBe("Formato anterior");
    expect(getPublicationFormatLabel("USER_PRODUCT")).toBe("Formato actual");
  });
});

const variant: BulkStockVariant = {
  key: "MLA1491525989:183428567442",
  itemId: "MLA1491525989",
  familyId: "183428567442",
  variationId: "183428567442",
  userProductId: "MLAU123",
  model: "USER_PRODUCT",
  title: "Remera niña Leopardo Rosa",
  color: "Rosa",
  size: "46",
  publicationType: "USER_PRODUCT",
  currentStock: 1,
  newStock: 4,
  currentQuantity: 1,
  requestedQuantity: 4,
  currentStatus: "active",
  status: "active",
  editable: true,
  needsChange: true,
  reason: null,
  storeId: null,
  networkNodeId: null,
};
