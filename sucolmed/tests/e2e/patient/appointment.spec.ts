import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

test.describe("预约挂号", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "patient");
    await page.goto("/patient/new-appointment");
  });

  test("P2: 应该显示三步预约向导", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("预约挂号");
    await expect(page.locator("text=选择科室")).toBeVisible();
  });

  test("P3: 应该能查看我的预约", async ({ page }) => {
    await page.goto("/patient/appointments");
    await expect(page.locator("h1")).toContainText("我的预约");
  });
});
