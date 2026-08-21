import { expect, test } from "@playwright/test";

test("keeps publication filters in the shareable URL", async ({ page }) => {
  await page.goto("/publicaciones?page=1&search=&type=&status=");

  await page.getByRole("textbox", { name: "Buscar" }).fill("campera azul");
  await page.getByRole("textbox", { name: "Estado" }).fill("active");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();

  await expect.poll(() => {
    const url = new URL(page.url());

    return {
      page: url.searchParams.get("page"),
      search: url.searchParams.get("search"),
      status: url.searchParams.get("status"),
    };
  }).toEqual({ page: "1", search: "campera azul", status: "active" });
});

test("shows real publications and keeps pagination in the URL", async ({
  page,
}) => {
  test.skip(
    !process.env.BACKEND_API_URL,
    "Requiere un backend NestJS real y sincronizado.",
  );

  await page.goto("/publicaciones?page=1&search=&type=&status=");

  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  await expect(table.locator("tbody tr.ant-table-row").first()).toBeVisible();

  const nextPage = page.locator(".ant-pagination-next button");
  await expect(
    nextPage,
    "El backend real necesita más de 20 publicaciones para probar paginación.",
  ).toBeEnabled();
  await nextPage.click();

  await expect.poll(() => new URL(page.url()).searchParams.get("page")).toBe(
    "2",
  );

  await expect(table.locator("tbody tr.ant-table-row").first()).toBeVisible();
  const productName = await table
    .locator("tbody tr.ant-table-row")
    .first()
    .locator("td")
    .first()
    .innerText();

  await page.getByRole("textbox", { name: "Buscar" }).fill(productName);
  await page.getByRole("button", { name: "Aplicar filtros" }).click();

  await expect.poll(() => {
    const url = new URL(page.url());

    return {
      page: url.searchParams.get("page"),
      search: url.searchParams.get("search"),
    };
  }).toEqual({ page: "1", search: productName });
});
