import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SimilarPublicationVariantGallery } from "./similar-publication-variant-gallery.client";

describe("SimilarPublicationVariantGallery", () => {
  afterEach(cleanup);

  it("renders the Ant Design picture wall for one color", () => {
    render(
      <SimilarPublicationVariantGallery
        color="Rosa"
        onPicturesChange={vi.fn()}
        onUploadingChange={vi.fn()}
        pictures={[
          {
            key: "rose-6:ROSE-1",
            sourceReference: "rose-6",
            picture: {
              id: "ROSE-1",
              secureUrl: "https://example.com/rose-1.jpg",
            },
          },
        ]}
        picturesByVariant={{
          "rose-6": [
            {
              id: "ROSE-1",
              secureUrl: "https://example.com/rose-1.jpg",
            },
          ],
        }}
        uploadAction={vi.fn()}
        variants={[createVariant("rose-6", "6")]}
      />,
    );

    expect(screen.getByLabelText("Agregar foto nueva")).toBeInTheDocument();
    expect(screen.getByText(/máximo 3 MB por imagen/i)).toBeInTheDocument();
  });

  it("allows adding the first picture when the color has no pictures", () => {
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

    expect(screen.getByLabelText("Agregar foto nueva")).toBeInTheDocument();
    expect(screen.getByText(/0 fotos/i)).toBeInTheDocument();
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
