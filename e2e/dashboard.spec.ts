import { expect, test } from "@playwright/test";

test("loads the dashboard", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveTitle(/Panel/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Dashboard" }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText("Panel de gestión", { exact: true }),
  ).toBeVisible();
});
