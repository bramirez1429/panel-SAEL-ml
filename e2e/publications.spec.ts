import { expect, test } from "@playwright/test";

test("keeps publication filters in the shareable URL", async ({ page }) => {
  await page.goto("/publicaciones?page=1&cursor=&search=&type=&status=");
  await page.waitForLoadState("networkidle");

  await page.getByRole("textbox", { name: "Buscar" }).fill("campera azul");
  await page.getByRole("textbox", { name: "Estado" }).fill("active");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();

  await expect.poll(() => {
    const url = new URL(page.url());

    return {
      page: url.searchParams.get("page"),
      cursor: url.searchParams.get("cursor"),
      search: url.searchParams.get("search"),
      status: url.searchParams.get("status"),
    };
  }).toEqual({
    page: "1",
    cursor: "",
    search: "campera azul",
    status: "active",
  });
});

test("shows real publications and keeps pagination in the URL", async ({
  page,
}) => {
  test.skip(
    !process.env.BACKEND_API_URL,
    "Requiere un backend NestJS real y sincronizado.",
  );

  await page.goto("/publicaciones?page=1&cursor=&search=&type=&status=");

  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  await expect(table.locator("tbody tr.ant-table-row").first()).toBeVisible();

  const nextPage = page.getByRole("button", { name: "Siguiente" });
  await expect(
    nextPage,
    "El backend real necesita más de 20 publicaciones para probar paginación.",
  ).toBeEnabled();
  await nextPage.click();

  await expect.poll(() => {
    const url = new URL(page.url());

    return {
      page: url.searchParams.get("page"),
      cursor: url.searchParams.get("cursor"),
    };
  }).toMatchObject({ page: "2" });
  await expect.poll(() => new URL(page.url()).searchParams.get("cursor")).not.toBeNull();

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

test("opens a real publication detail from the table", async ({ page }) => {
  test.skip(
    !process.env.BACKEND_API_URL,
    "Requiere un backend NestJS real y sincronizado.",
  );

  await page.goto("/publicaciones?page=1&cursor=&search=&type=&status=");

  const firstDetailLink = page
    .locator("tbody tr.ant-table-row")
    .first()
    .getByRole("link", { name: "Ver detalle" });

  await expect(firstDetailLink).toBeVisible();
  await firstDetailLink.click();

  await expect(page).toHaveURL(/\/publicaciones\/[^/?]+$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Publicaciones" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
  await expect(page.getByText("Canal", { exact: true })).toBeVisible();
  await expect(page.getByText("Stock", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Vendidos", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(/^Familia → hijos y variantes$|^Variaciones Legacy$/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "← Volver a Publicaciones" }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: "← Volver a Publicaciones" })
    .click();
  await expect(page).toHaveURL(/\/publicaciones$/);
  await expect(page.getByRole("table")).toBeVisible();
});
