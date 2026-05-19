import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

test.describe("患者评价", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "patient");
    await page.goto("/patient/reviews");
  });

  test("P5: 应该显示评价列表", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("我的评价");
  });

  test("P5: 应该能评价已完成的预约", async ({ page }) => {
    await page.goto("/patient/appointments");
    const reviewButton = page.locator('button:has-text("评价")').first();
    if (await reviewButton.isVisible()) {
      await reviewButton.click();
      await page.click('[data-slot="star"]:nth-child(5)');
      await page.fill('textarea', "很好的医生");
      await page.click('button:has-text("提交评价")');
    }
  });
});
