import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

test.describe("科室管理", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/admin/departments");
  });

  test("A1: 应该显示科室列表", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("科室管理");
    await expect(page.locator("button:has-text('新增科室')")).toBeVisible();
  });
});
