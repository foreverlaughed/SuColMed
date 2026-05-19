import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

test.describe("药品管理", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/admin/medicines");
  });

  test("A7: 应该显示药品列表", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("药品管理");
    await expect(page.locator("button:has-text('新增药品')")).toBeVisible();
  });
});
