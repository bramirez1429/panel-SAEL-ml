import { beforeEach, describe, expect, it, vi } from "vitest";

const execute = vi.hoisted(() => vi.fn());

vi.mock("@/modules/publications/publications.composition.server", () => ({
  createGetPublicationVariantsQuery: () => ({ execute }),
}));

import { loadPublicationVariantsAction } from "./load-publication-variants.action";

describe("loadPublicationVariantsAction", () => {
  beforeEach(() => execute.mockReset());

  it("returns variants for one validated publication", async () => {
    const variants = [{ id: "1" }];
    execute.mockResolvedValue(variants);

    await expect(loadPublicationVariantsAction({ publicationId: "MLA123", publicationType: "LEGACY", familyId: null }))
      .resolves.toEqual({ ok: true, variants });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid identifiers before reaching the repository", async () => {
    await expect(loadPublicationVariantsAction({ publicationId: "invalid", publicationType: "LEGACY", familyId: null }))
      .resolves.toMatchObject({ ok: false });
    expect(execute).not.toHaveBeenCalled();
  });
});
