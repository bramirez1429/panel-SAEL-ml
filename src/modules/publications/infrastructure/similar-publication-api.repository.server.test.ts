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

  it("uploads a new picture through the backend multipart endpoint", async () => {
    const client = createClient();
    client.postMultipart.mockResolvedValue({ id: "NEW-1", secureUrl: "https://new.example/picture.jpg" });
    const repository = new SimilarPublicationApiRepository(client);
    const file = new File(["new"], "new.jpg", { type: "image/jpeg" });

    await expect(repository.uploadPicture(file)).resolves.toEqual({
      id: "NEW-1",
      secureUrl: "https://new.example/picture.jpg",
    });

    const [path, body] = client.postMultipart.mock.calls[0] ?? [];
    expect(path).toBe("/mercadolibre/direct/publicar-similar/pictures");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("file")).toBeInstanceOf(File);
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
