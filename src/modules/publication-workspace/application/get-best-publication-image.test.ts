import { describe, expect, it } from "vitest";

import { getBestPublicationImage } from "./get-best-publication-image";

describe("getBestPublicationImage", () => {
  it("prioriza secure_url sobre el resto de las imágenes", () => {
    expect(
      getBestPublicationImage({
        pictures: [{ secure_url: "https://img/secure.jpg", url: "https://img/image.jpg" }],
        thumbnail: "https://img/thumbnail.jpg",
      }),
    ).toBe("https://img/secure.jpg");
  });

  it("usa url cuando secure_url no existe", () => {
    expect(
      getBestPublicationImage({
        pictures: [{ url: "https://img/image.jpg" }],
        thumbnail: "https://img/thumbnail.jpg",
      }),
    ).toBe("https://img/image.jpg");
  });

  it("usa thumbnail cuando no hay una imagen principal", () => {
    expect(
      getBestPublicationImage({
        pictures: [],
        thumbnail: "https://img/thumbnail.jpg",
      }),
    ).toBe("https://img/thumbnail.jpg");
  });

  it("devuelve null cuando no hay ninguna imagen", () => {
    expect(getBestPublicationImage({ pictures: [], thumbnail: null })).toBeNull();
  });
});
