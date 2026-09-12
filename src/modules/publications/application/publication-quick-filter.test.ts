import { describe, expect, it } from "vitest";

import type { Publication } from "../domain/publication.model";
import { matchesPublicationQuickFilters } from "./publication-quick-filter";

const publication = (title: string): Publication => ({
  id: title,
  title,
  channel: "MERCADO_LIBRE",
  status: "active",
  thumbnailUrl: null,
  permalink: null,
  price: null,
  stock: 1,
  sold: 0,
  attributes: [],
  group: { key: title, type: "LEGACY", familyId: null, userProductId: null, itemId: null, childrenCount: 0 },
});

describe("matchesPublicationQuickFilters", () => {
  it("muestra todo cuando todos los switches están en No", () => {
    expect(matchesPublicationQuickFilters(publication("Campera unisex"), [])).toBe(true);
  });

  it("normaliza mayúsculas y tildes para producto y público", () => {
    expect(matchesPublicationQuickFilters(publication("REMERA estampada para NIÑA"), ["GIRLS_TSHIRT"])).toBe(true);
    expect(matchesPublicationQuickFilters(publication("Hoodie para niño"), ["BOYS_SWEATSHIRT"])).toBe(true);
  });

  it("combina filtros activos como alternativas", () => {
    expect(matchesPublicationQuickFilters(publication("Buzo de nena"), ["GIRLS_TSHIRT", "GIRLS_SWEATSHIRT"])).toBe(true);
    expect(matchesPublicationQuickFilters(publication("Remera de dama"), ["BOYS_TSHIRT", "BOYS_SWEATSHIRT"])).toBe(false);
  });
});
