import { expect, test } from "@playwright/test";

test("loads the home page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Panel/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Panel" }),
  ).toBeVisible();
});
