import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

test.describe("医生仪表盘", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "doctor");
    await page.goto("/doctor/dashboard");
  });

  test("D1: 应该显示今日排班信息", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("今日概览");
    await expect(page.locator("text=今日排班")).toBeVisible();
    await expect(page.locator("text=待诊患者")).toBeVisible();
  });

  test("D1: 应该显示最近预约列表", async ({ page }) => {
    await expect(page.locator("text=最近预约")).toBeVisible();
  });
});
