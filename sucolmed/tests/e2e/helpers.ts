import { type Page, expect } from "@playwright/test";

export async function loginAs(page: Page, role: "admin" | "doctor" | "patient") {
  const credentials = {
    admin: { phone: "13800000000", password: "admin123" },
    doctor: { phone: "13800000010", password: "123456" },
    patient: { phone: "13800000001", password: "123456" },
  };

  await page.goto("/login");
  await page.fill('input[name="phone"]', credentials[role].phone);
  await page.fill('input[name="password"]', credentials[role].password);
  await page.click('button[type="submit"]');
  await expect(page).not.toHaveURL("/login");
}

export async function waitForToast(page: Page, text: string) {
  const toast = page.locator('[role="status"]').filter({ hasText: text });
  await expect(toast).toBeVisible({ timeout: 5_000 });
}
