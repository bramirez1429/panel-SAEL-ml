import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SimilarPublicationVariantGallery } from "./similar-publication-variant-gallery.client";

describe("SimilarPublicationVariantGallery", () => {
  afterEach(cleanup);

  it("changes the main image when a thumbnail is selected", async () => {
    const user = userEvent.setup();
    render(
      <SimilarPublicationVariantGallery
        color="Rosa"
        onPicturesChange={vi.fn()}
        onUploadingChange={vi.fn()}
        pictures={[
          {
            key: "rose-6:ROSE-1",
            sourceReference: "rose-6",
            picture: { id: "ROSE-1", secureUrl: "https://example.com/rose-1.jpg" },
          },
          {
            key: "rose-8:ROSE-2",
            sourceReference: "rose-8",
            picture: { id: "ROSE-2", secureUrl: "https://example.com/rose-2.jpg" },
          },
        ]}
        picturesByVariant={{
          "rose-6": [{ id: "ROSE-1", secureUrl: "https://example.com/rose-1.jpg" }],
          "rose-8": [{ id: "ROSE-2", secureUrl: "https://example.com/rose-2.jpg" }],
        }}
        uploadAction={vi.fn()}
        variants={[
          createVariant("rose-6", "6"),
          createVariant("rose-8", "8"),
        ]}
      />,
    );

    const mainPicture = screen.getByAltText("Rosa, imagen principal");
    expect(mainPicture).toHaveAttribute("src", "https://example.com/rose-1.jpg");

    await user.click(screen.getByRole("button", { name: "Ver imagen 2 de Rosa" }));

    expect(mainPicture).toHaveAttribute("src", "https://example.com/rose-2.jpg");
  });

  it("renders an explicit empty state without inventing images", () => {
    render(
      <SimilarPublicationVariantGallery
        color="Negro"
        onPicturesChange={vi.fn()}
        onUploadingChange={vi.fn()}
        pictures={[]}
        picturesByVariant={{ "black-10": [] }}
        uploadAction={vi.fn()}
        variants={[createVariant("black-10", "10")]}
      />,
    );

    expect(screen.getByLabelText("Sin imágenes para Negro")).toBeInTheDocument();
  });
});

function createVariant(sourceReference: string, size: string) {
  return {
    sourceReference,
    variant: {
      sourceReference,
      price: 100,
      stock: 2,
      sku: null,
      pictureIds: [],
      attributes: [],
    },
    color: "Rosa",
    size,
    stock: 2,
    sku: "SKU",
    price: 100,
  };
}
