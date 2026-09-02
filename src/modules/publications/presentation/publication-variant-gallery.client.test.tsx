import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { PublicationVariantGallery } from "./publication-variant-gallery.client";

describe("PublicationVariantGallery", () => {
  afterEach(cleanup);

  it("changes only this card main picture when a thumbnail is selected", async () => {
    const user = userEvent.setup();
    render(
      <PublicationVariantGallery
        label="Rosa"
        pictures={[
          { id: "PINK-1", url: "https://example.com/pink-1.jpg" },
          { id: "PINK-2", url: "https://example.com/pink-2.jpg" },
        ]}
      />,
    );

    const mainPicture = screen.getByAltText("Rosa, imagen principal");
    expect(mainPicture).toHaveAttribute("src", "https://example.com/pink-1.jpg");

    await user.click(screen.getByRole("button", { name: "Ver imagen 2 de Rosa" }));

    expect(mainPicture).toHaveAttribute("src", "https://example.com/pink-2.jpg");
  });
});
