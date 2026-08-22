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
        cursor: "cursor-3",
        search: "  campera  ",
        type: "USER_PRODUCT",
        status: "active",
      }),
    ).toEqual({
      page: 3,
      cursor: "cursor-3",
      search: "campera",
      type: "USER_PRODUCT",
      status: "active",
    });
  });

  it("falls back safely for invalid page and type values", () => {
    expect(
      parsePublicationsSearchParams({ page: "0", type: "UNKNOWN" }),
    ).toEqual({ page: 1, cursor: null, search: "", type: null, status: "" });
  });

  it("uses the first value when a query key is repeated", () => {
    expect(
      parsePublicationsSearchParams({
        page: ["2", "4"],
        search: ["uno", "dos"],
        cursor: ["cursor-2", "cursor-4"],
      }),
    ).toEqual({
      page: 2,
      cursor: "cursor-2",
      search: "uno",
      type: null,
      status: "",
    });
  });
});

describe("buildPublicationsUrl", () => {
  it("keeps every filter explicit and resets only patched values", () => {
    expect(
      buildPublicationsUrl(
        {
          page: 2,
          cursor: "cursor-2",
          search: "campera",
          type: "LEGACY",
          status: "active",
        },
        { page: 1, cursor: null, type: null },
      ),
    ).toBe(
      "/publicaciones?page=1&cursor=&search=campera&type=&status=active",
    );
  });
});
