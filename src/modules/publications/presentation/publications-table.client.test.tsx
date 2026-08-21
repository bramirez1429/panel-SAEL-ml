import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PublicationsPage } from "../domain/publication.model";
import { PublicationsTable } from "./publications-table.client";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(
    "page=1&search=campera&type=LEGACY&status=active",
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  useSearchParams: () => navigation.searchParams,
}));

const page: PublicationsPage = {
  publications: [],
  page: 1,
  pageSize: 20,
  count: 0,
  total: 42,
  totalPages: 3,
};

describe("PublicationsTable", () => {
  afterEach(() => {
    cleanup();
    navigation.push.mockReset();
  });

  it("updates only the page while preserving URL filters", async () => {
    const user = userEvent.setup();
    const { container } = render(<PublicationsTable page={page} />);
    const nextPageButton = container.querySelector<HTMLButtonElement>(
      ".ant-pagination-next button",
    );

    expect(nextPageButton).not.toBeNull();

    if (!nextPageButton) {
      throw new Error("Pagination must render a next-page button");
    }

    await user.click(nextPageButton);

    expect(navigation.push).toHaveBeenCalledWith(
      "/publicaciones?page=2&search=campera&type=LEGACY&status=active",
    );
  });
});
