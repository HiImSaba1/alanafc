import { expect, test } from "@playwright/test";

const consentKey = "alanafc_cookie_consent_v1";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ key }) => window.localStorage.setItem(key, "accepted"), { key: consentKey });
});

test("visitors can review and change their saved cookie choice", async ({ page }) => {
  await page.goto("/cookies");

  const preferenceControl = page.locator(".cookie-preference-control");
  await expect(preferenceControl).toContainText("Αποδοχή");
  const changeChoice = preferenceControl.getByRole("button", { name: "Αλλαγή επιλογής" });
  await changeChoice.click();

  const dialog = page.getByRole("dialog", { name: "Η επιλογή είναι δική σας." });
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  await dialog.getByRole("button", { name: "Απόρριψη" }).click();
  await expect(dialog).toBeHidden();
  await expect(changeChoice).toBeFocused();
  await expect(preferenceControl).toContainText("Απόρριψη");
  await expect.poll(() => page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "null")?.choice, consentKey)).toBe("declined");

  const footerSettings = page.getByRole("button", { name: "Ρυθμίσεις Cookies" });
  await footerSettings.click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  await dialog.getByRole("button", { name: "Αποδοχή" }).click();
  await expect(footerSettings).toBeFocused();
  await expect.poll(() => page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "null")?.choice, consentKey)).toBe("accepted");
});
