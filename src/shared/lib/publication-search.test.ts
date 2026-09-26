import { describe, expect, it } from "vitest";

import { parsePublicationSearch } from "./publication-search";

describe("parsePublicationSearch", () => {
  it.each([
    ["123456", { type: "FAMILY", value: "123456" }],
    ["MLA123", { type: "MLA", value: "MLA123" }],
    ["mla123", { type: "MLA", value: "MLA123" }],
    ["MLAU123", { type: "MLAU", value: "MLAU123" }],
    ["mlau123", { type: "MLAU", value: "MLAU123" }],
    ["Remera Miami", { type: "TITLE", value: "Remera Miami" }],
    ["  Remera   Miami  ", { type: "TITLE", value: "Remera Miami" }],
  ] as const)("clasifica %s", (term, expected) => {
    expect(parsePublicationSearch(term)).toEqual(expected);
  });

  it("devuelve null para una búsqueda vacía", () => {
    expect(parsePublicationSearch("   ")).toBeNull();
  });
});
