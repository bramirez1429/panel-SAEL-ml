import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicationsPage } from "../domain/publication.model";
import { PublicationsPagination } from "./publications-pagination.client";

const navigation = vi.hoisted(() => ({ push: vi.fn(), params: new URLSearchParams("page=1&search=remera&type=USER_PRODUCT&status=active") }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: navigation.push }), useSearchParams: () => navigation.params }));

describe("PublicationsPagination", () => {
  beforeEach(() => { navigation.push.mockReset(); sessionStorage.clear(); });
  afterEach(cleanup);

  it("usa Pagination oficial y avanza sólo con nextCursor", async () => {
    const user = userEvent.setup();
    render(<PublicationsPagination page={page(1, null, false, "cursor-2")} />);
    expect(screen.queryByRole("button", { name: "Siguiente" })).not.toBeInTheDocument();
    await user.click(screen.getByTitle("2"));
    expect(navigation.push).toHaveBeenCalledWith("/publicaciones?page=2&cursor=cursor-2&search=remera&type=USER_PRODUCT&status=active");
  });

  it("vuelve a página 1 sin cursor y no inventa una página siguiente al finalizar", async () => {
    navigation.params = new URLSearchParams("page=2&cursor=cursor-2&search=remera&type=USER_PRODUCT&status=active");
    const user = userEvent.setup();
    render(<PublicationsPagination page={page(2, "cursor-2", true, null)} />);
    expect(screen.queryByTitle("3")).not.toBeInTheDocument();
    await user.click(screen.getByTitle("1"));
    expect(navigation.push).toHaveBeenCalledWith("/publicaciones?page=1&cursor=&search=remera&type=USER_PRODUCT&status=active");
  });
});

function page(current: number, cursor: string | null, done: boolean, nextCursor: string | null): PublicationsPage {
  return { publications: [], page: current, pageSize: 20, cursor, nextCursor, done, count: 1, productsCount: 40 };
}
