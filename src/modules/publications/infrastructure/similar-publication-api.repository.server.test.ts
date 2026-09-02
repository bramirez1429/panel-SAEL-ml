import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { SimilarPublicationApiRepository } from "./similar-publication-api.repository.server";

const draft = {
  sourceKey: "item:MLA1",
  sourceType: "LEGACY" as const,
  categoryId: "MLA1",
  familyName: null,
  titleTemplate: "Remera",
  description: null,
  currencyId: "ARS",
  listingTypeId: "gold_special",
  buyingMode: "buy_it_now",
  saleTerms: [],
  shipping: null,
  channels: ["marketplace"],
  variants: [{
    sourceReference: "variant:1",
    price: 100,
    stock: 2,
    sku: null,
    attributes: [],
    pictureIds: [],
  }],
  pictures: [],
};

function createClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    postMultipart: vi.fn(),
  };
}

describe("SimilarPublicationApiRepository", () => {
  it("loads the safe draft from the backend using the encoded sourceKey", async () => {
    const client = createClient();
    client.get.mockResolvedValue(draft);
    const repository = new SimilarPublicationApiRepository(client);

    await expect(repository.getDraft("item:MLA1")).resolves.toEqual(draft);

    expect(client.get).toHaveBeenCalledWith(
      "/mercadolibre/direct/publicar-similar/draft?sourceKey=item%3AMLA1",
    );
  });

  it("uploads a new picture as authenticated Base64 JSON", async () => {
    const client = createClient();
    client.post.mockResolvedValue({ id: "NEW-1", secureUrl: "https://new.example/picture.jpg" });
    const repository = new SimilarPublicationApiRepository(client);
    const file = new File(["new"], "new.jpg", { type: "image/jpeg" });

    await expect(repository.uploadPicture(file)).resolves.toEqual({
      id: "NEW-1",
      secureUrl: "https://new.example/picture.jpg",
    });

    expect(client.post).toHaveBeenCalledWith(
      "/mercadolibre/direct/publicar-similar/pictures/base64",
      {
        fileName: "new.jpg",
        mimeType: "image/jpeg",
        base64: "bmV3",
      },
      { timeoutMs: 120_000 },
    );
    expect(client.postMultipart).not.toHaveBeenCalled();
  });

  it("rejects unsupported files before calling the backend", async () => {
    const client = createClient();
    const repository = new SimilarPublicationApiRepository(client);

    await expect(
      repository.uploadPicture(new File(["text"], "file.txt", { type: "text/plain" })),
    ).rejects.toMatchObject({
      code: "SIMILAR_PUBLICATION_PICTURE_INVALID_TYPE",
      message: "La imagen debe ser JPG, JPEG o PNG.",
    });
    expect(client.post).not.toHaveBeenCalled();
  });

  it("rejects pictures larger than 3 MB before encoding", async () => {
    const client = createClient();
    const repository = new SimilarPublicationApiRepository(client);
    const file = new File(
      [new Uint8Array(3 * 1024 * 1024 + 1)],
      "large.png",
      { type: "image/png" },
    );

    await expect(repository.uploadPicture(file)).rejects.toMatchObject({
      code: "SIMILAR_PUBLICATION_PICTURE_INVALID_SIZE",
      message: "La imagen debe pesar como máximo 3 MB.",
    });
    expect(client.post).not.toHaveBeenCalled();
  });

  it("keeps validating the Base64 endpoint response", async () => {
    const client = createClient();
    client.post.mockResolvedValue({ id: "NEW-1", secureUrl: null });
    const repository = new SimilarPublicationApiRepository(client);

    await expect(
      repository.uploadPicture(
        new File(["image"], "image.png", { type: "image/png" }),
      ),
    ).rejects.toMatchObject({ code: "API_INVALID_RESPONSE" });
  });

  it("normalizes the backend sourceKey as the newly created sourceKey", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      status: "SUCCESS",
      sourceKey: "item:MLA2",
      items: [{
        variantKey: "variant:1",
        status: "CREATED",
        itemId: "MLA2",
        userProductId: null,
        familyId: null,
        error: null,
      }],
    });
    const repository = new SimilarPublicationApiRepository(client);

    const result = await repository.create({
      sourceKey: "item:MLA1",
      categoryId: "MLA1",
      familyName: null,
      titleTemplate: "Nueva",
      description: null,
      currencyId: "ARS",
      listingTypeId: "gold_special",
      buyingMode: "buy_it_now",
      saleTerms: [],
      shipping: null,
      channels: ["marketplace"],
      pictures: ["NEW-1"],
      variants: [{ sourceReference: "variant:1", price: 100, stock: 2, sku: null, attributes: [], pictureIds: ["NEW-1"] }],
    });

    expect(result.newSourceKey).toBe("item:MLA2");
    expect(client.post).toHaveBeenCalledWith(
      "/mercadolibre/direct/publicar-similar",
      expect.objectContaining({ sourceKey: "item:MLA1" }),
      { timeoutMs: 120_000 },
    );
  });
});
