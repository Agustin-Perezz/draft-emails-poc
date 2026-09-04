import { expect, test } from "@playwright/test";

const HEADING = "To get started, edit the page.tsx file.";

test("home page loads and shows heading", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Next/);
  await expect(page.locator("h1")).toHaveText(HEADING);
  await expect(page.getByRole("link", { name: "Deploy Now" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Documentation" })).toBeVisible();
});
