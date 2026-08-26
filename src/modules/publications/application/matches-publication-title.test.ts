import { describe, expect, it } from "vitest";
import { matchesPublicationTitle } from "./matches-publication-title";

describe("matchesPublicationTitle", () => {
  it.each([
    ["Buzo Cuello Redondo Frizado Mujer Brooklyn NYC", "buzo brook", true],
    ["Buzo Cuello Redondo Frizado Mujer Brooklyn NYC", "brook buzo", true],
    ["Pack X4 Unid Remeras Nenas Algodón Peinado Primavera Verano", "algodon verano", true],
    ["Remera clásica", "REMERA", true],
    ["Remera clásica", "remera-clas", true],
    ["Remera clásica", "pantalon", false],
    ["Camiseta", "", true],
  ])("compara %s con %s", (title, search, expected) => {
    expect(matchesPublicationTitle(title, search)).toBe(expected);
  });
});
