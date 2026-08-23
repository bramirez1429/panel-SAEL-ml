import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BackToPublicationsLink } from "./publication-back-link";

describe("BackToPublicationsLink", () => {
  afterEach(cleanup);

  it("preserves the originating listing URL", () => {
    render(<BackToPublicationsLink returnTo="/publicaciones?page=2&search=campera" />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/publicaciones?page=2&search=campera",
    );
  });

  it("falls back to the listing for direct detail access", () => {
    render(<BackToPublicationsLink />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/publicaciones");
  });
});
