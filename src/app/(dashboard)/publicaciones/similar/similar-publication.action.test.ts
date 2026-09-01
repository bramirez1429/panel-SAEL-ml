import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  upload: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/modules/publications/publications.composition.server", () => ({
  createCreateSimilarPublicationCommand: () => ({ execute: mocks.create }),
  createUploadSimilarPublicationPictureCommand: () => ({ execute: mocks.upload }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import {
  createSimilarPublicationAction,
  uploadSimilarPublicationPictureAction,
} from "./similar-publication.action";

const input = {
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
  variants: [{
    sourceReference: "variant:1",
    price: 100,
    stock: 1,
    sku: null,
    attributes: [],
    pictureIds: ["NEW-1"],
  }],
} as const;

describe("similar publication actions", () => {
  beforeEach(() => {
    mocks.create.mockReset();
    mocks.upload.mockReset();
    mocks.revalidatePath.mockReset();
  });

  it("returns the backend creation result and invalidates publications", async () => {
    const result = { status: "SUCCESS" as const, items: [], newSourceKey: "item:MLA2" };
    mocks.create.mockResolvedValue(result);

    await expect(createSimilarPublicationAction(input)).resolves.toEqual({ ok: true, result });
    expect(mocks.create).toHaveBeenCalledWith(input);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/publicaciones");
  });

  it("passes the new file to the backend upload command", async () => {
    const picture = { id: "NEW-1", secureUrl: "https://new.example/1.jpg" };
    mocks.upload.mockResolvedValue(picture);
    const file = new File(["new"], "new.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", file);

    await expect(uploadSimilarPublicationPictureAction(formData)).resolves.toEqual({ ok: true, picture });
    expect(mocks.upload).toHaveBeenCalledWith(file);
  });
});
