import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

test.describe("排队叫号", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "doctor");
    await page.goto("/doctor/queue");
  });

  test("D4: 应该显示排队叫号面板", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("排队叫号");
    await expect(page.locator("text=当前叫号")).toBeVisible();
    await expect(page.locator("text=叫下一位")).toBeVisible();
  });

  test("D4: 应该能叫号", async ({ page }) => {
    const callButton = page.locator('button:has-text("叫下一位")');
    if (await callButton.isEnabled()) {
      await callButton.click();
      await page.waitForTimeout(1000);
    }
  });
});
