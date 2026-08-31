import { describe, expect, it } from "vitest";

import { parsePublicationSearch } from "./publication-search.parser";

describe("parsePublicationSearch", () => {
  it("detecta FAMILY para un término numérico", () => {
    expect(parsePublicationSearch("123456789")).toEqual({ type: "FAMILY", value: "123456789" });
  });

  it("detecta MLA exacto", () => {
    expect(parsePublicationSearch("MLA1947917494")).toEqual({ type: "MLA", value: "MLA1947917494" });
  });

  it("normaliza MLA a mayúsculas", () => {
    expect(parsePublicationSearch("mla1947917494")).toEqual({ type: "MLA", value: "MLA1947917494" });
  });

  it("detecta TITLE y recorta espacios", () => {
    expect(parsePublicationSearch("   remera mujer   ")).toEqual({ type: "TITLE", value: "remera mujer" });
  });

  it("devuelve null para una query vacía", () => {
    expect(parsePublicationSearch("   ")).toBeNull();
  });
});
