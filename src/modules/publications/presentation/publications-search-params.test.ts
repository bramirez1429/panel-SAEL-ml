import { describe, expect, it } from "vitest";

import {
  buildPublicationsUrl,
  parsePublicationsSearchParams,
} from "./publications-search-params";

describe("parsePublicationsSearchParams", () => {
  it("converts valid URL values into typed filters", () => {
    expect(
      parsePublicationsSearchParams({
        page: "3",
        search: "  campera  ",
        type: "USER_PRODUCT",
        status: "active",
      }),
    ).toEqual({
      page: 3,
      search: "campera",
      type: "USER_PRODUCT",
      status: "active",
    });
  });

  it("falls back safely for invalid page and type values", () => {
    expect(
      parsePublicationsSearchParams({ page: "0", type: "UNKNOWN" }),
    ).toEqual({ page: 1, search: "", type: null, status: "" });
  });

  it("uses the first value when a query key is repeated", () => {
    expect(
      parsePublicationsSearchParams({
        page: ["2", "4"],
        search: ["uno", "dos"],
      }),
    ).toEqual({ page: 2, search: "uno", type: null, status: "" });
  });
});

describe("buildPublicationsUrl", () => {
  it("keeps every filter explicit and resets only patched values", () => {
    expect(
      buildPublicationsUrl(
        { page: 2, search: "campera", type: "LEGACY", status: "active" },
        { page: 1, type: null },
      ),
    ).toBe(
      "/publicaciones?page=1&search=campera&type=&status=active",
    );
  });
});
