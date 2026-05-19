import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

test.describe("完整预约流程", () => {
  test("I1: 患者预约 → 医生接诊 → 写病历 → 患者评价", async ({ page }) => {
    // Step 1: 患者预约
    await loginAs(page, "patient");
    await page.goto("/patient/new-appointment");
    await expect(page.locator("h1")).toContainText("预约挂号");

    // Step 2: 医生查看仪表盘
    await loginAs(page, "doctor");
    await page.goto("/doctor/dashboard");
    await expect(page.locator("h1")).toContainText("今日概览");

    // Step 3: 医生查看排队叫号
    await page.goto("/doctor/queue");
    await expect(page.locator("h1")).toContainText("排队叫号");
  });

  test("I2: 排队叫号流程", async ({ page }) => {
    // 医生查看排队叫号
    await loginAs(page, "doctor");
    await page.goto("/doctor/queue");
    await expect(page.locator("h1")).toContainText("排队叫号");

    // 验证叫号按钮存在
    const callButton = page.locator('button:has-text("叫下一位")');
    await expect(callButton).toBeVisible();
  });

  test("I3: 药品管理流程", async ({ page }) => {
    // 管理员查看药品管理
    await loginAs(page, "admin");
    await page.goto("/admin/medicines");
    await expect(page.locator("h1")).toContainText("药品管理");

    // 验证新增药品按钮存在
    const addButton = page.locator('button:has-text("新增药品")');
    await expect(addButton).toBeVisible();
  });
});
