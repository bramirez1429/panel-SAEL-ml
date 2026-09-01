import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND_TEST"); }),
}));

vi.mock("@/modules/publications/publications.composition.server", () => ({
  createGetSimilarPublicationDraftQuery: () => ({ execute: mocks.execute }),
}));
vi.mock("@/modules/tiendanube/tiendanube.composition.server", () => ({
  getTiendanubeCategories: () => Promise.resolve([]),
}));
vi.mock("@/modules/publications/presentation/similar-publication-form.client", () => ({
  SimilarPublicationForm: ({ draft, returnTo }: { draft: { sourceKey: string }; returnTo: string }) => (
    <div>Draft {draft.sourceKey} — {returnTo}</div>
  ),
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("../tiendanube.action", () => ({ replicatePublicationAction: vi.fn() }));
vi.mock("./similar-publication.action", () => ({
  createSimilarPublicationAction: vi.fn(),
  uploadSimilarPublicationPictureAction: vi.fn(),
}));

import SimilarPublicationPage from "./page";

describe("SimilarPublicationPage", () => {
  beforeEach(() => {
    cleanup();
    mocks.execute.mockReset();
    mocks.notFound.mockClear();
  });

  it("loads the safe draft from the backend in the Server Component", async () => {
    mocks.execute.mockResolvedValue({ sourceKey: "family:123" });
    const result = await SimilarPublicationPage({
      searchParams: Promise.resolve({
        sourceKey: "family:123",
        returnTo: "/publicaciones?page=3",
      }),
    });
    render(result);

    expect(mocks.execute).toHaveBeenCalledWith("family:123");
    expect(screen.getByText("Draft family:123 — /publicaciones?page=3")).toBeInTheDocument();
  });

  it("rejects invalid source keys before calling the backend", async () => {
    await expect(SimilarPublicationPage({
      searchParams: Promise.resolve({ sourceKey: "family:../../secret" }),
    })).rejects.toThrow("NEXT_NOT_FOUND_TEST");

    expect(mocks.execute).not.toHaveBeenCalled();
  });
});
