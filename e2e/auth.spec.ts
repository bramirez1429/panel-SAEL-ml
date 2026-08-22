import { expect, test } from "@playwright/test";

test("shows login and validates credentials before contacting the backend", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { level: 1, name: "Iniciar sesión" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();

  await page.getByLabel("Email").fill("email-invalido");
  await page.getByLabel("Contraseña").fill("password");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText("Ingresá un email válido.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
