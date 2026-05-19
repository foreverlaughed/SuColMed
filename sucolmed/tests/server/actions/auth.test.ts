import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { registerUser } from "@/server/actions/auth";

describe("registerUser", () => {
  it("should fail with invalid phone format", async () => {
    const result = await registerUser({
      name: "张三",
      phone: "123",
      password: "password123",
      role: "student",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("手机号");
  });

  it("should fail with short password", async () => {
    const result = await registerUser({
      name: "张三",
      phone: "13800138000",
      password: "123",
      role: "student",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("密码");
  });

  it("should fail with short name", async () => {
    const result = await registerUser({
      name: "张",
      phone: "13800138000",
      password: "password123",
      role: "student",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("姓名");
  });
});
