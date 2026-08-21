import { expect, test } from "@playwright/test";

test("navigates between dashboard sections while preserving the shell", async ({
  page,
}) => {
  await page.goto("/dashboard");

  const sidebar = page.getByRole("complementary");
  const header = page.getByRole("banner");

  await expect(sidebar).toBeVisible();
  await expect(header).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Dashboard" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByText("Resumen general del panel de gestión.", { exact: true }),
  ).toBeVisible();

  await sidebar.getByRole("link", { name: "Publicaciones" }).click();

  await expect(page).toHaveURL(/\/publicaciones$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Publicaciones" }),
  ).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(header).toBeVisible();

  await sidebar.getByRole("link", { name: "Pedidos" }).click();

  await expect(page).toHaveURL(/\/pedidos$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Pedidos" }),
  ).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(header).toBeVisible();
});
