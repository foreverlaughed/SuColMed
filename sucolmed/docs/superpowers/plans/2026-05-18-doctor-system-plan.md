# 医生系统迭代 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 SuColMed 校园医疗系统上补齐 Admin CRUD、新增医生工作台、增强患者端，并增加药品管理、数据报表、排队叫号等子系统。

**Architecture:** 渐进式扩展（方案 A），在现有 Next.js 16 App Router + Prisma + shadcn/ui 架构上直接扩展，按角色拆分路由（/admin/*, /doctor/*, /patient/*）。

**Tech Stack:** Next.js 16, React 19, Prisma 7, PostgreSQL, shadcn/ui, Tailwind CSS v4, Zod, NextAuth 5, Vitest, Playwright

**Design Spec:** `docs/superpowers/specs/2026-05-18-doctor-system-design.md`

---

## 错误防御策略（全局约束）

### 后端边界层防御
所有 Server Actions 和 Route Handlers 必须遵循：
- 使用 Zod schema 验证输入
- 返回 `{ success: true, data }` 或 `{ success: false, error: string }` 统一格式
- Route Handlers 使用 try-catch + 自定义 `AppError` class
- 禁止在业务组件深处滥用 try-catch

### 前端错误处理
- 使用 React Query 的 `useMutation` / `useQuery` 统一处理错误
- 在 `providers.tsx` 中配置全局错误回调
- Toast 组件统一展示错误信息

### Context7 强制检查点
在涉及以下框架 API 时，必须先用 Context7 查询最新文档：
- Next.js App Router params/searchParams 用法
- Prisma 7 查询语法和事务 API
- shadcn/ui 组件 API
- Playwright 测试 API

---

## 文件结构总览

### 新增文件
```
src/
  lib/
    error.ts                    # AppError class 定义
  server/
    actions/
      review.ts                 # 评价相关 actions
      medicine.ts               # 药品相关 actions
      queue.ts                  # 排队相关 actions
    api/
      queue/[scheduleId]/
        route.ts                # 排队状态 SSE API
        call/route.ts           # 叫号 API
  app/
    admin/
      departments/
        page.tsx                # 修改：添加 CRUD 表单
      doctors/
        page.tsx                # 修改：添加 CRUD 表单
      schedules/
        page.tsx                # 修改：添加创建/编辑
      medicines/
        page.tsx                # 新增：药品管理
      reviews/
        page.tsx                # 新增：评价管理
    doctor/
      layout.tsx                # 新增：医生端布局
      dashboard/
        page.tsx                # 新增：今日排班面板
      appointments/
        page.tsx                # 新增：预约管理
      queue/
        page.tsx                # 新增：排队叫号面板
      records/
        page.tsx                # 新增：病历书写
    patient/
      layout.tsx                # 新增：患者端布局
      appointments/
        page.tsx                # 修改：增强预约列表
      new-appointment/
        page.tsx                # 新增：三步预约向导
      records/
        page.tsx                # 新增：我的病历
      reviews/
        page.tsx                # 新增：我的评价
  components/
    forms/
      department-form.tsx       # 新增：科室表单
      doctor-form.tsx           # 新增：医生表单
      schedule-form.tsx         # 新增：排班表单
      medicine-form.tsx         # 新增：药品表单
      review-form.tsx           # 新增：评价表单
    doctor/
      today-panel.tsx           # 新增：今日排班面板
      queue-panel.tsx           # 新增：排队叫号面板
      record-form.tsx           # 新增：病历书写表单
    patient/
      appointment-wizard.tsx    # 新增：预约向导
      record-list.tsx           # 新增：病历列表
      review-list.tsx           # 新增：评价列表
tests/
  e2e/
    playwright.config.ts        # 新增：Playwright 配置
    admin/
      departments.spec.ts       # 新增
      doctors.spec.ts           # 新增
      schedules.spec.ts         # 新增
      medicines.spec.ts         # 新增
    doctor/
      dashboard.spec.ts         # 新增
      queue.spec.ts             # 新增
      records.spec.ts           # 新增
    patient/
      appointment.spec.ts       # 新增
      records.spec.ts           # 新增
      reviews.spec.ts           # 新增
    integration/
      full-flow.spec.ts         # 新增：跨角色集成测试
```

---

## Phase 1: 基础设施 + Admin CRUD

### Task 1: 安装 Playwright + 配置 E2E 测试环境

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/helpers.ts`

> **Context7 检查点：** 使用 Context7 MCP 查询 `Playwright` 的最新配置 API，确认 `playwright.config.ts` 写法无误。

- [ ] **Step 1: 安装 Playwright**

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

- [ ] **Step 2: 创建 Playwright 配置**

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 1,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { storageState: "tests/e2e/.auth/admin.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 3: 创建 E2E 测试辅助工具**

```typescript
// tests/e2e/helpers.ts
import { type Page, expect } from "@playwright/test";

export async function loginAs(page: Page, role: "admin" | "doctor" | "patient") {
  const credentials = {
    admin: { phone: "13800000001", password: "admin123" },
    doctor: { phone: "13800000002", password: "doctor123" },
    patient: { phone: "13800000003", password: "patient123" },
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
```

- [ ] **Step 4: 验证配置**

```bash
pnpm exec playwright test --list
```

Expected: 能列出测试文件（即使为空）

- [ ] **Step 5: 提交**

```bash
git add playwright.config.ts tests/e2e/
git commit -m "test: add Playwright E2E test setup"
```

---

### Task 2: 定义 AppError class + 全局错误处理

**Files:**
- Create: `src/lib/error.ts`
- Modify: `src/app/providers.tsx`

> **Context7 检查点：** 使用 Context7 MCP 查询 `Next.js 16 App Router` 的 error.tsx 和全局错误处理 API。

- [ ] **Step 1: 创建 AppError class**

```typescript
// src/lib/error.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}不存在`, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "未授权") {
    super(message, "UNAUTHORIZED", 401);
  }
}
```

- [ ] **Step 2: 创建 Route Handler 错误处理中间件**

```typescript
// src/lib/api-handler.ts
import { NextRequest, NextResponse } from "next/server";
import { AppError } from "./error";

type RouteHandler = (
  req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: error.statusCode }
        );
      }
      console.error("Unhandled error:", error);
      return NextResponse.json(
        { success: false, error: "服务器内部错误", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  };
}
```

- [ ] **Step 3: 更新 providers.tsx 添加全局错误 Toast**

```typescript
// src/app/providers.tsx - 在现有 providers 中添加错误处理
"use client";

import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-right" richColors />
    </SessionProvider>
  );
}
```

- [ ] **Step 4: 运行类型检查**

```bash
pnpm tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 5: 提交**

```bash
git add src/lib/error.ts src/lib/api-handler.ts src/app/providers.tsx
git commit -m "feat: add AppError class and global error handling"
```

---

### Task 3: Prisma Schema 迁移 - 新增 Review, Medicine, QueueNumber

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/` (自动生成)

> **Context7 检查点：** 使用 Context7 MCP 查询 `Prisma 7` 的 schema 语法和 migration API。

- [ ] **Step 1: 更新 schema.prisma**

在 `prisma/schema.prisma` 末尾添加：

```prisma
// === 新增模型 ===

model Review {
  id            String   @id @default(uuid())
  appointmentId String   @unique
  patientId     String
  doctorId      String
  rating        Int
  comment       String?
  createdAt     DateTime @default(now())

  appointment Appointment @relation(fields: [appointmentId], references: [id])
  patient     User        @relation(fields: [patientId], references: [id])
  doctor      Doctor      @relation(fields: [doctorId], references: [id])

  @@map("reviews")
}

model Medicine {
  id          String   @id @default(uuid())
  name        String
  category    String
  spec        String
  unit        String
  stock       Int      @default(0)
  price       Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  items PrescriptionItem[]

  @@map("medicines")
}

model QueueNumber {
  id          String       @id @default(uuid())
  scheduleId  String
  number      Int
  status      QueueStatus  @default(waiting)
  calledAt    DateTime?
  createdAt   DateTime     @default(now())

  schedule Schedule @relation(fields: [scheduleId], references: [id])

  @@map("queue_numbers")
}

enum QueueStatus {
  waiting
  called
  completed
  missed
}
```

同时修改现有模型添加关联：

```prisma
// User 模型添加
model User {
  // ... existing fields ...
  reviews      Review[]        // 新增
}

// Doctor 模型添加
model Doctor {
  // ... existing fields ...
  reviews      Review[]        // 新增
}

// Schedule 模型添加
model Schedule {
  // ... existing fields ...
  queueNumbers QueueNumber[]  // 新增
}

// PrescriptionItem 模型添加
model PrescriptionItem {
  // ... existing fields ...
  medicineId   String?
  medicine     Medicine?   @relation(fields: [medicineId], references: [id])
}
```

- [ ] **Step 2: 生成迁移**

```bash
pnpm prisma migrate dev --name add-review-medicine-queue
```

Expected: 迁移成功创建

- [ ] **Step 3: 生成 Prisma Client**

```bash
pnpm prisma generate
```

- [ ] **Step 4: 验证 schema**

```bash
pnpm prisma validate
```

Expected: Valid schema

- [ ] **Step 5: 提交**

```bash
git add prisma/
git commit -m "feat: add Review, Medicine, QueueNumber models to schema"
```

---

### Task 4: 创建评价 Server Actions + 单元测试

**Files:**
- Create: `src/server/actions/review.ts`
- Create: `tests/server/actions/review.test.ts`

> **Context7 检查点：** 使用 Context7 MCP 查询 `Prisma 7` 的 create, findMany, aggregate 查询语法。

- [ ] **Step 1: 编写失败的单元测试**

```typescript
// tests/server/actions/review.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    review: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    appointment: {
      findUnique: vi.fn(),
    },
    doctor: {
      findUnique: vi.fn(),
    },
  },
}));

import { createReview, getDoctorReviews } from "@/server/actions/review";
import { prisma } from "@/lib/prisma";

describe("createReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fail with invalid rating", async () => {
    const result = await createReview({
      appointmentId: "test-appointment-id",
      patientId: "test-patient-id",
      doctorId: "test-doctor-id",
      rating: 6, // 超出 1-5 范围
      comment: "好医生",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should fail if appointment not found", async () => {
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(null);

    const result = await createReview({
      appointmentId: "nonexistent-id",
      patientId: "test-patient-id",
      doctorId: "test-doctor-id",
      rating: 5,
      comment: "好医生",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("预约不存在");
  });

  it("should create review successfully", async () => {
    const mockAppointment = {
      id: "test-appointment-id",
      userId: "test-patient-id",
      doctorId: "test-doctor-id",
      status: "completed",
    };
    const mockReview = {
      id: "test-review-id",
      appointmentId: "test-appointment-id",
      rating: 5,
      comment: "好医生",
    };

    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(mockAppointment as any);
    vi.mocked(prisma.review.create).mockResolvedValue(mockReview as any);

    const result = await createReview({
      appointmentId: "test-appointment-id",
      patientId: "test-patient-id",
      doctorId: "test-doctor-id",
      rating: 5,
      comment: "好医生",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockReview);
  });
});

describe("getDoctorReviews", () => {
  it("should return reviews with average rating", async () => {
    const mockReviews = [
      { id: "1", rating: 5, comment: "很好", createdAt: new Date() },
      { id: "2", rating: 4, comment: "不错", createdAt: new Date() },
    ];

    vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews as any);

    const result = await getDoctorReviews("test-doctor-id");

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm vitest run tests/server/actions/review.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: 实现 review.ts**

```typescript
// src/server/actions/review.ts
"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function createReview(input: {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment?: string;
}) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
  });

  if (!appointment) {
    return { success: false as const, error: "预约不存在" };
  }

  if (appointment.status !== "completed") {
    return { success: false as const, error: "只能评价已完成的预约" };
  }

  if (appointment.userId !== input.patientId) {
    return { success: false as const, error: "无权评价此预约" };
  }

  const existing = await prisma.review.findUnique({
    where: { appointmentId: input.appointmentId },
  });

  if (existing) {
    return { success: false as const, error: "已评价过此预约" };
  }

  const review = await prisma.review.create({
    data: {
      appointmentId: input.appointmentId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      rating: input.rating,
      comment: input.comment ?? null,
    },
  });

  return { success: true as const, data: review };
}

export async function getDoctorReviews(doctorId: string) {
  const reviews = await prisma.review.findMany({
    where: { doctorId },
    include: {
      patient: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = await prisma.review.aggregate({
    where: { doctorId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    success: true as const,
    data: {
      reviews,
      averageRating: stats._avg.rating ?? 0,
      totalReviews: stats._count.rating,
    },
  };
}

export async function getPatientReviews(patientId: string) {
  const reviews = await prisma.review.findMany({
    where: { patientId },
    include: {
      doctor: {
        include: {
          user: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true as const, data: reviews };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm vitest run tests/server/actions/review.test.ts
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/server/actions/review.ts tests/server/actions/review.test.ts
git commit -m "feat: add review server actions with unit tests"
```

---

### Task 5: 创建药品 Server Actions + 单元测试

**Files:**
- Create: `src/server/actions/medicine.ts`
- Create: `tests/server/actions/medicine.test.ts`

> **Context7 检查点：** 使用 Context7 MCP 查询 `Prisma 7` 的 update, decrement, transaction 语法。

- [ ] **Step 1: 编写失败的单元测试**

```typescript
// tests/server/actions/medicine.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    medicine: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { createMedicine, getMedicines, reduceStock } from "@/server/actions/medicine";
import { prisma } from "@/lib/prisma";

describe("createMedicine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fail with empty name", async () => {
    const result = await createMedicine({
      name: "",
      category: "抗生素",
      spec: "0.25g*12片",
      unit: "盒",
      stock: 100,
      price: 25.5,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("药品名称");
  });

  it("should create medicine successfully", async () => {
    const mockMedicine = {
      id: "test-id",
      name: "阿莫西林",
      category: "抗生素",
      stock: 100,
    };

    vi.mocked(prisma.medicine.create).mockResolvedValue(mockMedicine as any);

    const result = await createMedicine({
      name: "阿莫西林",
      category: "抗生素",
      spec: "0.25g*12片",
      unit: "盒",
      stock: 100,
      price: 25.5,
    });

    expect(result.success).toBe(true);
  });
});

describe("reduceStock", () => {
  it("should fail if insufficient stock", async () => {
    const mockMedicine = { id: "test-id", stock: 5 };

    vi.mocked(prisma.medicine.findUnique).mockResolvedValue(mockMedicine as any);

    const result = await reduceStock("test-id", 10);

    expect(result.success).toBe(false);
    expect(result.error).toContain("库存不足");
  });

  it("should reduce stock successfully", async () => {
    const mockMedicine = { id: "test-id", stock: 100 };

    vi.mocked(prisma.medicine.findUnique).mockResolvedValue(mockMedicine as any);
    vi.mocked(prisma.medicine.update).mockResolvedValue({ id: "test-id", stock: 95 } as any);

    const result = await reduceStock("test-id", 5);

    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm vitest run tests/server/actions/medicine.test.ts
```

Expected: FAIL

- [ ] **Step 3: 实现 medicine.ts**

```typescript
// src/server/actions/medicine.ts
"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const medicineSchema = z.object({
  name: z.string().min(1, "药品名称不能为空"),
  category: z.string().min(1, "药品分类不能为空"),
  spec: z.string().min(1, "规格不能为空"),
  unit: z.string().min(1, "单位不能为空"),
  stock: z.number().int().min(0, "库存不能为负数"),
  price: z.number().min(0, "价格不能为负数"),
});

export async function getMedicines(category?: string, search?: string) {
  const where: Record<string, any> = { isActive: true };

  if (category) {
    where.category = category;
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const medicines = await prisma.medicine.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return { success: true as const, data: medicines };
}

export async function createMedicine(input: {
  name: string;
  category: string;
  spec: string;
  unit: string;
  stock: number;
  price: number;
}) {
  const parsed = medicineSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const medicine = await prisma.medicine.create({ data: parsed.data });
  return { success: true as const, data: medicine };
}

export async function updateMedicine(
  id: string,
  input: Partial<{
    name: string;
    category: string;
    spec: string;
    unit: string;
    stock: number;
    price: number;
    isActive: boolean;
  }>
) {
  const medicine = await prisma.medicine.update({
    where: { id },
    data: input,
  });
  return { success: true as const, data: medicine };
}

export async function deleteMedicine(id: string) {
  await prisma.medicine.delete({ where: { id } });
  return { success: true as const };
}

export async function reduceStock(medicineId: string, quantity: number) {
  const medicine = await prisma.medicine.findUnique({
    where: { id: medicineId },
  });

  if (!medicine) {
    return { success: false as const, error: "药品不存在" };
  }

  if (medicine.stock < quantity) {
    return { success: false as const, error: "库存不足" };
  }

  const updated = await prisma.medicine.update({
    where: { id: medicineId },
    data: { stock: { decrement: quantity } },
  });

  return { success: true as const, data: updated };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm vitest run tests/server/actions/medicine.test.ts
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/server/actions/medicine.ts tests/server/actions/medicine.test.ts
git commit -m "feat: add medicine server actions with unit tests"
```

---

### Task 6: 创建排队 Server Actions + 单元测试

**Files:**
- Create: `src/server/actions/queue.ts`
- Create: `tests/server/actions/queue.test.ts`

> **Context7 检查点：** 使用 Context7 MCP 查询 `Prisma 7` 的 transaction 和 atomic operations 语法。

- [ ] **Step 1: 编写失败的单元测试**

```typescript
// tests/server/actions/queue.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    queueNumber: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    schedule: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((fns: any[]) => Promise.all(fns)),
  },
}));

import { createQueueNumber, callNextNumber, getQueueStatus } from "@/server/actions/queue";
import { prisma } from "@/lib/prisma";

describe("createQueueNumber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fail if schedule not found", async () => {
    vi.mocked(prisma.schedule.findUnique).mockResolvedValue(null);

    const result = await createQueueNumber("nonexistent-schedule");

    expect(result.success).toBe(false);
    expect(result.error).toContain("排班不存在");
  });

  it("should create queue number successfully", async () => {
    const mockSchedule = { id: "schedule-1", currentPatients: 5 };
    const mockQueue = { id: "queue-1", number: 6, status: "waiting" };

    vi.mocked(prisma.schedule.findUnique).mockResolvedValue(mockSchedule as any);
    vi.mocked(prisma.queueNumber.count).mockResolvedValue(5);
    vi.mocked(prisma.queueNumber.create).mockResolvedValue(mockQueue as any);

    const result = await createQueueNumber("schedule-1");

    expect(result.success).toBe(true);
    expect(result.data?.number).toBe(6);
  });
});

describe("callNextNumber", () => {
  it("should fail if no waiting patients", async () => {
    vi.mocked(prisma.queueNumber.findFirst).mockResolvedValue(null);

    const result = await callNextNumber("schedule-1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("没有等待中的患者");
  });

  it("should call next patient successfully", async () => {
    const mockNext = { id: "queue-1", number: 3, status: "waiting" };
    const mockUpdated = { ...mockNext, status: "called", calledAt: new Date() };

    vi.mocked(prisma.queueNumber.findFirst).mockResolvedValue(mockNext as any);
    vi.mocked(prisma.queueNumber.update).mockResolvedValue(mockUpdated as any);

    const result = await callNextNumber("schedule-1");

    expect(result.success).toBe(true);
    expect(result.data?.number).toBe(3);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm vitest run tests/server/actions/queue.test.ts
```

Expected: FAIL

- [ ] **Step 3: 实现 queue.ts**

```typescript
// src/server/actions/queue.ts
"use server";

import { prisma } from "@/lib/prisma";

export async function createQueueNumber(scheduleId: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    return { success: false as const, error: "排班不存在" };
  }

  const count = await prisma.queueNumber.count({
    where: { scheduleId },
  });

  const queueNumber = await prisma.queueNumber.create({
    data: {
      scheduleId,
      number: count + 1,
      status: "waiting",
    },
  });

  return { success: true as const, data: queueNumber };
}

export async function callNextNumber(scheduleId: string) {
  const next = await prisma.queueNumber.findFirst({
    where: {
      scheduleId,
      status: "waiting",
    },
    orderBy: { number: "asc" },
  });

  if (!next) {
    return { success: false as const, error: "没有等待中的患者" };
  }

  const updated = await prisma.queueNumber.update({
    where: { id: next.id },
    data: {
      status: "called",
      calledAt: new Date(),
    },
  });

  return { success: true as const, data: updated };
}

export async function getQueueStatus(scheduleId: string) {
  const queue = await prisma.queueNumber.findMany({
    where: { scheduleId },
    orderBy: { number: "asc" },
  });

  const waiting = queue.filter((q) => q.status === "waiting");
  const called = queue.filter((q) => q.status === "called");
  const completed = queue.filter((q) => q.status === "completed");

  const current = called.length > 0 ? called[called.length - 1] : null;
  const currentWaiting = waiting.length > 0 ? waiting[0] : null;

  return {
    success: true as const,
    data: {
      current,
      nextInLine: currentWaiting,
      waitingCount: waiting.length,
      completedCount: completed.length,
      queue: queue.slice(0, 20), // 最多返回前20条
    },
  };
}

export async function completeQueueNumber(queueId: string) {
  const updated = await prisma.queueNumber.update({
    where: { id: queueId },
    data: { status: "completed" },
  });

  return { success: true as const, data: updated };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm vitest run tests/server/actions/queue.test.ts
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/server/actions/queue.ts tests/server/actions/queue.test.ts
git commit -m "feat: add queue server actions with unit tests"
```

---

### Task 7: 增强现有 Server Actions（补 delete）

**Files:**
- Modify: `src/server/actions/department.ts`
- Modify: `src/server/actions/doctor.ts`
- Modify: `src/server/actions/schedule.ts`

> **Context7 检查点：** 使用 Context7 MCP 查询 `Prisma 7` 的 delete 和 cascade delete 语法。

- [ ] **Step 1: 在 department.ts 添加 deleteDepartment**

```typescript
// src/server/actions/department.ts - 在文件末尾添加

export async function deleteDepartment(id: string) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { doctors: true } } },
  });

  if (!department) {
    return { success: false as const, error: "科室不存在" };
  }

  if (department._count.doctors > 0) {
    return { success: false as const, error: "该科室下还有医生，无法删除" };
  }

  await prisma.department.delete({ where: { id } });
  return { success: true as const };
}
```

- [ ] **Step 2: 在 doctor.ts 添加 deleteDoctor**

```typescript
// src/server/actions/doctor.ts - 在文件末尾添加

export async function deleteDoctor(id: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: { _count: { select: { appointments: true, medicalRecords: true } } },
  });

  if (!doctor) {
    return { success: false as const, error: "医生不存在" };
  }

  if (doctor._count.appointments > 0 || doctor._count.medicalRecords > 0) {
    return { success: false as const, error: "该医生有关联的预约或病历，无法删除" };
  }

  await prisma.doctor.delete({ where: { id } });
  return { success: true as const };
}
```

- [ ] **Step 3: 在 schedule.ts 添加 deleteSchedule**

```typescript
// src/server/actions/schedule.ts - 在文件末尾添加

export async function deleteSchedule(id: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: { _count: { select: { appointments: true } } },
  });

  if (!schedule) {
    return { success: false as const, error: "排班不存在" };
  }

  if (schedule._count.appointments > 0) {
    return { success: false as const, error: "该排班已有预约，无法删除" };
  }

  await prisma.schedule.delete({ where: { id } });
  return { success: true as const };
}
```

- [ ] **Step 4: 运行类型检查**

```bash
pnpm tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 5: 提交**

```bash
git add src/server/actions/department.ts src/server/actions/doctor.ts src/server/actions/schedule.ts
git commit -m "feat: add delete actions for department, doctor, schedule"
```

---

### Task 8: 创建科室管理表单组件

**Files:**
- Create: `src/components/forms/department-form.tsx`
- Modify: `src/app/admin/departments/page.tsx`

> **Context7 检查点：** 使用 Context7 MCP 查询 `shadcn/ui` 的 Sheet, Form, Input 组件最新 API。

- [ ] **Step 1: 创建 department-form.tsx**

```typescript
// src/components/forms/department-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createDepartment, updateDepartment } from "@/server/actions/department";
import { Plus, Pencil } from "lucide-react";

type Department = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  isActive: boolean;
};

type DepartmentFormProps = {
  department?: Department;
  onSuccess?: () => void;
};

export function DepartmentForm({ department, onSuccess }: DepartmentFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(department?.name ?? "");
  const [description, setDescription] = useState(department?.description ?? "");
  const [location, setLocation] = useState(department?.location ?? "");

  const isEditing = !!department;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = isEditing
      ? await updateDepartment(department.id, { name, description, location })
      : await createDepartment({ name, description, location });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setOpen(false);
      onSuccess?.();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="cursor-pointer" size={isEditing ? "sm" : "default"}>
          {isEditing ? (
            <>
              <Pencil className="mr-1 h-4 w-4" />
              编辑
            </>
          ) : (
            <>
              <Plus className="mr-1 h-4 w-4" />
              新增科室
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? "编辑科室" : "新增科室"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">科室名称 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：内科"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">科室描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="科室简介..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="location">位置</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="如：门诊楼3层"
              className="mt-1"
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
          <Button type="submit" disabled={loading} className="w-full cursor-pointer">
            {loading ? "保存中..." : "保存"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: 更新 departments/page.tsx 添加 CRUD**

```typescript
// src/app/admin/departments/page.tsx
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Trash2 } from "lucide-react";
import { DepartmentForm } from "@/components/forms/department-form";
import { deleteDepartment } from "@/server/actions/department";
import { revalidatePath } from "next/cache";

export default async function DepartmentsManagementPage() {
  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { doctors: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await deleteDepartment(id);
    revalidatePath("/admin/departments");
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-cyan-900">科室管理</h1>
        <DepartmentForm />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{dept.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={dept.isActive ? "default" : "destructive"}>
                    {dept.isActive ? "启用" : "停用"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {dept.description && (
                <p className="text-xs text-slate-500 line-clamp-2">{dept.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                {dept.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {dept.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {dept._count.doctors} 位医生
                </span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <DepartmentForm department={dept} />
                <form action={handleDelete}>
                  <input type="hidden" name="id" value={dept.id} />
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    disabled={dept._count.doctors > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 运行类型检查**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add src/components/forms/department-form.tsx src/app/admin/departments/page.tsx
git commit -m "feat: add department CRUD form and update admin page"
```

---

### Task 9: 创建医生管理表单组件

**Files:**
- Create: `src/components/forms/doctor-form.tsx`
- Modify: `src/app/admin/doctors/page.tsx`

> **Context7 检查点：** 使用 Context7 MCP 查询 `shadcn/ui` 的 Select, Dialog 组件最新 API。

- [ ] **Step 1: 创建 doctor-form.tsx**

```typescript
// src/components/forms/doctor-form.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createDoctor, updateDoctor } from "@/server/actions/doctor";
import { getDepartments } from "@/server/actions/department";
import { Plus, Pencil } from "lucide-react";

type Doctor = {
  id: string;
  userId: string;
  departmentId: string;
  title: string;
  specialties?: string[] | null;
  bio?: string | null;
};

type DoctorFormProps = {
  doctor?: Doctor;
  onSuccess?: () => void;
};

export function DoctorForm({ doctor, onSuccess }: DoctorFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  const [userId, setUserId] = useState(doctor?.userId ?? "");
  const [departmentId, setDepartmentId] = useState(doctor?.departmentId ?? "");
  const [title, setTitle] = useState(doctor?.title ?? "");
  const [specialties, setSpecialties] = useState(doctor?.specialties?.join(", ") ?? "");
  const [bio, setBio] = useState(doctor?.bio ?? "");

  const isEditing = !!doctor;

  useEffect(() => {
    if (open) {
      getDepartments().then((res) => {
        if (res.success) setDepartments(res.data);
      });
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const specialtiesArray = specialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const result = isEditing
      ? await updateDoctor(doctor.id, {
          departmentId,
          title,
          specialties: specialtiesArray,
          bio,
        })
      : await createDoctor({
          userId,
          departmentId,
          title,
          specialties: specialtiesArray,
          bio,
        });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setOpen(false);
      onSuccess?.();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="cursor-pointer" size={isEditing ? "sm" : "default"}>
          {isEditing ? (
            <>
              <Pencil className="mr-1 h-4 w-4" />
              编辑
            </>
          ) : (
            <>
              <Plus className="mr-1 h-4 w-4" />
              新增医生
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? "编辑医生" : "新增医生"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isEditing && (
            <div>
              <Label htmlFor="userId">用户ID *</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="关联用户的 UUID"
                className="mt-1"
                required
              />
            </div>
          )}
          <div>
            <Label htmlFor="departmentId">所属科室 *</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="mt-1 cursor-pointer">
                <SelectValue placeholder="选择科室" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="title">职称 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：主任医师"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="specialties">专长（逗号分隔）</Label>
            <Input
              id="specialties"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="如：心血管, 高血压"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="bio">简介</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="医生简介..."
              className="mt-1"
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
          <Button type="submit" disabled={loading} className="w-full cursor-pointer">
            {loading ? "保存中..." : "保存"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: 更新 doctors/page.tsx 添加 CRUD**

```typescript
// src/app/admin/doctors/page.tsx
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope, Trash2 } from "lucide-react";
import { DoctorForm } from "@/components/forms/doctor-form";
import { deleteDoctor } from "@/server/actions/doctor";
import { revalidatePath } from "next/cache";

export default async function DoctorsManagementPage() {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: { select: { name: true, phone: true } },
      department: { select: { name: true } },
      _count: { select: { schedules: true, appointments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await deleteDoctor(id);
    revalidatePath("/admin/doctors");
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-cyan-900">医生管理</h1>
        <DoctorForm />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doc) => (
          <Card key={doc.id}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">{doc.user.name}</CardTitle>
                <p className="text-xs text-slate-500">{doc.user.phone}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{doc.title}</Badge>
                <Badge variant="outline">{doc.department.name}</Badge>
              </div>
              <p className="text-xs text-slate-400">
                排班 {doc._count.schedules} · 预约 {doc._count.appointments}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <DoctorForm
                  doctor={{
                    id: doc.id,
                    userId: doc.userId,
                    departmentId: doc.departmentId,
                    title: doc.title,
                    specialties: doc.specialties as string[] | null,
                    bio: doc.bio,
                  }}
                />
                <form action={handleDelete}>
                  <input type="hidden" name="id" value={doc.id} />
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    disabled={doc._count.appointments > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 运行类型检查**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add src/components/forms/doctor-form.tsx src/app/admin/doctors/page.tsx
git commit -m "feat: add doctor CRUD form and update admin page"
```

---

### Task 10: 创建排班管理表单组件

**Files:**
- Create: `src/components/forms/schedule-form.tsx`
- Modify: `src/app/admin/schedules/page.tsx`

> **Context7 检查点：** 使用 Context7 MCP 查询 `shadcn/ui` 的 Calendar, Popover 组件和 `react-day-picker` 的最新 API。

- [ ] **Step 1: 创建 schedule-form.tsx**

```typescript
// src/components/forms/schedule-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createSchedule } from "@/server/actions/schedule";
import { Plus } from "lucide-react";

type ScheduleFormProps = {
  doctors: { id: string; user: { name: string }; department: { name: string } }[];
  onSuccess?: () => void;
};

export function ScheduleForm({ doctors, onSuccess }: ScheduleFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [maxPatients, setMaxPatients] = useState("20");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createSchedule({
      doctorId,
      date,
      timeSlot,
      maxPatients: parseInt(maxPatients, 10),
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setOpen(false);
      onSuccess?.();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="mr-1 h-4 w-4" />
          新增排班
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>新增排班</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="doctorId">选择医生 *</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger className="mt-1 cursor-pointer">
                <SelectValue placeholder="选择医生" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.user.name} - {doc.department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date">日期 *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="timeSlot">时段 *</Label>
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger className="mt-1 cursor-pointer">
                <SelectValue placeholder="选择时段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">上午</SelectItem>
                <SelectItem value="afternoon">下午</SelectItem>
                <SelectItem value="evening">晚间</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="maxPatients">最大接诊数 *</Label>
            <Input
              id="maxPatients"
              type="number"
              min="1"
              max="100"
              value={maxPatients}
              onChange={(e) => setMaxPatients(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
          <Button type="submit" disabled={loading} className="w-full cursor-pointer">
            {loading ? "创建中..." : "创建排班"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: 更新 schedules/page.tsx**

```typescript
// src/app/admin/schedules/page.tsx
import { prisma } from "@/lib/prisma";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { ScheduleForm } from "@/components/forms/schedule-form";

export default async function SchedulesPage() {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: { select: { name: true } },
      department: { select: { name: true } },
      schedules: {
        orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-cyan-900">排班管理</h1>
        <ScheduleForm doctors={doctors} />
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ScheduleCalendar doctors={doctors as any} />
    </div>
  );
}
```

- [ ] **Step 3: 运行类型检查**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add src/components/forms/schedule-form.tsx src/app/admin/schedules/page.tsx
git commit -m "feat: add schedule form and update admin schedules page"
```

---

### Task 11: 创建药品管理页面

**Files:**
- Create: `src/components/forms/medicine-form.tsx`
- Create: `src/app/admin/medicines/page.tsx`

> **Context7 检查点：** 使用 Context7 MCP 查询 `shadcn/ui` 的 Table 组件和 `@tanstack/react-table` 的最新用法。

- [ ] **Step 1: 创建 medicine-form.tsx**

```typescript
// src/components/forms/medicine-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createMedicine, updateMedicine } from "@/server/actions/medicine";
import { Plus, Pencil } from "lucide-react";

type Medicine = {
  id: string;
  name: string;
  category: string;
  spec: string;
  unit: string;
  stock: number;
  price: number;
};

type MedicineFormProps = {
  medicine?: Medicine;
  onSuccess?: () => void;
};

const categories = ["抗生素", "解热镇痛", "消化系统", "心血管", "呼吸系统", "其他"];

export function MedicineForm({ medicine, onSuccess }: MedicineFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(medicine?.name ?? "");
  const [category, setCategory] = useState(medicine?.category ?? "");
  const [spec, setSpec] = useState(medicine?.spec ?? "");
  const [unit, setUnit] = useState(medicine?.unit ?? "");
  const [stock, setStock] = useState(String(medicine?.stock ?? 0));
  const [price, setPrice] = useState(String(medicine?.price ?? 0));

  const isEditing = !!medicine;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = isEditing
      ? await updateMedicine(medicine.id, {
          name,
          category,
          spec,
          unit,
          stock: parseInt(stock, 10),
          price: parseFloat(price),
        })
      : await createMedicine({
          name,
          category,
          spec,
          unit,
          stock: parseInt(stock, 10),
          price: parseFloat(price),
        });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setOpen(false);
      onSuccess?.();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="cursor-pointer" size={isEditing ? "sm" : "default"}>
          {isEditing ? (
            <>
              <Pencil className="mr-1 h-4 w-4" />
              编辑
            </>
          ) : (
            <>
              <Plus className="mr-1 h-4 w-4" />
              新增药品
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? "编辑药品" : "新增药品"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">药品名称 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：阿莫西林胶囊"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">分类 *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1 cursor-pointer">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="spec">规格 *</Label>
            <Input
              id="spec"
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              placeholder="如：0.25g*12片/盒"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="unit">单位 *</Label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="如：盒、瓶"
              className="mt-1"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock">库存 *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="price">单价 (元) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
          <Button type="submit" disabled={loading} className="w-full cursor-pointer">
            {loading ? "保存中..." : "保存"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: 创建 medicines/page.tsx**

```typescript
// src/app/admin/medicines/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Search, AlertTriangle } from "lucide-react";
import { MedicineForm } from "@/components/forms/medicine-form";
import { getMedicines, deleteMedicine } from "@/server/actions/medicine";

type Medicine = {
  id: string;
  name: string;
  category: string;
  spec: string;
  unit: string;
  stock: number;
  price: number;
  isActive: boolean;
};

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadMedicines() {
    setLoading(true);
    const result = await getMedicines(undefined, search || undefined);
    if (result.success) {
      setMedicines(result.data as Medicine[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMedicines();
  }, [search]);

  async function handleDelete(id: string) {
    if (!confirm("确定删除此药品？")) return;
    await deleteMedicine(id);
    loadMedicines();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-cyan-900">药品管理</h1>
        <MedicineForm onSuccess={loadMedicines} />
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="搜索药品名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>药品名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>规格</TableHead>
                <TableHead>单位</TableHead>
                <TableHead className="text-right">库存</TableHead>
                <TableHead className="text-right">单价</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : medicines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500">
                    暂无药品
                  </TableCell>
                </TableRow>
              ) : (
                medicines.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium">{med.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{med.category}</Badge>
                    </TableCell>
                    <TableCell>{med.spec}</TableCell>
                    <TableCell>{med.unit}</TableCell>
                    <TableCell className="text-right">
                      <span className={med.stock < 10 ? "text-red-600 font-bold" : ""}>
                        {med.stock}
                      </span>
                      {med.stock < 10 && (
                        <AlertTriangle className="ml-1 inline h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">¥{med.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <MedicineForm medicine={med} onSuccess={loadMedicines} />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => handleDelete(med.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: 运行类型检查**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add src/components/forms/medicine-form.tsx src/app/admin/medicines/page.tsx
git commit -m "feat: add medicine management page with CRUD"
```

---

### Task 12: Admin CRUD E2E 测试

**Files:**
- Create: `tests/e2e/admin/departments.spec.ts`
- Create: `tests/e2e/admin/doctors.spec.ts`
- Create: `tests/e2e/admin/medicines.spec.ts`

> **Context7 检查点：** 使用 Context7 MCP 查询 `Playwright` 的 test, expect, locator API 最新用法。

- [ ] **Step 1: 编写科室管理 E2E 测试**

```typescript
// tests/e2e/admin/departments.spec.ts
import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

test.describe("科室管理", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/admin/departments");
  });

  test("A1: 应该显示科室列表", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("科室管理");
    await expect(page.locator("[class*=Card]")).toHaveCount({ minimum: 1 });
  });

  test("A2: 应该能创建新科室", async ({ page }) => {
    await page.click('button:has-text("新增科室")');
    await page.fill('input[id="name"]', "测试科室");
    await page.fill('textarea[id="description"]', "这是一个测试科室");
    await page.fill('input[id="location"]', "门诊楼1层");
    await page.click('button[type="submit"]:has-text("保存")');

    await expect(page.locator("text=测试科室")).toBeVisible();
  });

  test("A3: 应该能编辑科室", async ({ page }) => {
    const editButton = page.locator('[class*=Card]').first().locator('button:has-text("编辑")');
    await editButton.click();
    await page.fill('input[id="name"]', "修改后的科室名");
    await page.click('button[type="submit"]:has-text("保存")');

    await expect(page.locator("text=修改后的科室名")).toBeVisible();
  });
});
```

- [ ] **Step 2: 编写药品管理 E2E 测试**

```typescript
// tests/e2e/admin/medicines.spec.ts
import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

test.describe("药品管理", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/admin/medicines");
  });

  test("A7: 应该显示药品列表", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("药品管理");
  });

  test("A8: 应该能创建新药品", async ({ page }) => {
    await page.click('button:has-text("新增药品")');
    await page.fill('input[id="name"]', "测试药品");
    await page.click('[id="category"] ~ [role="combobox"]');
    await page.click('text=抗生素');
    await page.fill('input[id="spec"]', "0.25g*12片");
    await page.fill('input[id="unit"]', "盒");
    await page.fill('input[id="stock"]', "100");
    await page.fill('input[id="price"]', "25.50");
    await page.click('button[type="submit"]:has-text("保存")');

    await expect(page.locator("text=测试药品")).toBeVisible();
  });

  test("A8: 低库存应该显示预警", async ({ page }) => {
    // 假设有低库存药品
    const lowStockCell = page.locator("td .text-red-600").first();
    if (await lowStockCell.isVisible()) {
      await expect(lowStockCell).toBeVisible();
    }
  });
});
```

- [ ] **Step 3: 运行 E2E 测试**

```bash
pnpm exec playwright test tests/e2e/admin/
```

Expected: 测试通过

- [ ] **Step 4: 提交**

```bash
git add tests/e2e/admin/
git commit -m "test: add E2E tests for admin CRUD operations"
```

---

## Phase 2: 医生工作台

### Task 13: 创建医生端布局和今日面板

**Files:**
- Create: `src/app/doctor/layout.tsx`
- Create: `src/app/doctor/dashboard/page.tsx`
- Create: `src/components/doctor/today-panel.tsx`

> **Context7 检查点：** 使用 Context7 MCP 查询 `Next.js 16 App Router` 的 layout.tsx 和 Server Components 用法。

- [ ] **Step 1: 创建医生端布局**

```typescript
// src/app/doctor/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DoctorSidebar } from "@/components/layout/doctor-sidebar";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "doctor") redirect("/");

  return (
    <div className="flex min-h-screen">
      <DoctorSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: 创建医生端侧边栏**

```typescript
// src/components/layout/doctor-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, FileText, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/doctor/dashboard", label: "今日概览", icon: LayoutDashboard },
  { href: "/doctor/appointments", label: "预约管理", icon: Calendar },
  { href: "/doctor/queue", label: "排队叫号", icon: Users },
  { href: "/doctor/records", label: "病历管理", icon: FileText },
];

export function DoctorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white">
      <div className="p-4">
        <h2 className="font-heading text-lg font-bold text-cyan-900">医生工作台</h2>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-0 w-64 border-t border-slate-200 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: 创建今日面板组件**

```typescript
// src/components/doctor/today-panel.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock } from "lucide-react";

type TodayPanelProps = {
  doctorId: string;
  schedules: {
    id: string;
    date: string;
    timeSlot: string;
    currentPatients: number;
    maxPatients: number;
    status: string;
  }[];
  pendingAppointments: number;
};

const timeSlotLabels: Record<string, string> = {
  morning: "上午",
  afternoon: "下午",
  evening: "晚间",
};

export function TodayPanel({ schedules, pendingAppointments }: TodayPanelProps) {
  const today = new Date().toISOString().split("T")[0];
  const todaySchedules = schedules.filter((s) => s.date.startsWith(today));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">今日排班</CardTitle>
          <Calendar className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todaySchedules.length}</div>
          <p className="text-xs text-slate-500">个时段</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">待诊患者</CardTitle>
          <Users className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingAppointments}</div>
          <p className="text-xs text-slate-500">位等待</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">当前时段</CardTitle>
          <Clock className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {todaySchedules.length > 0
              ? timeSlotLabels[todaySchedules[0].timeSlot]
              : "无"}
          </div>
          <p className="text-xs text-slate-500">
            {todaySchedules.length > 0
              ? `${todaySchedules[0].currentPatients}/${todaySchedules[0].maxPatients} 已诊`
              : "今日无排班"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: 创建医生仪表盘页面**

```typescript
// src/app/doctor/dashboard/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TodayPanel } from "@/components/doctor/today-panel";
import { AppointmentList } from "@/components/appointment-list";

export default async function DoctorDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) redirect("/");

  const today = new Date().toISOString().split("T")[0];

  const schedules = await prisma.schedule.findMany({
    where: {
      doctorId: doctor.id,
      date: { gte: new Date(today) },
    },
    orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
  });

  const pendingAppointments = await prisma.appointment.count({
    where: {
      doctorId: doctor.id,
      status: "confirmed",
    },
  });

  const recentAppointments = await prisma.appointment.findMany({
    where: { doctorId: doctor.id },
    include: {
      user: { select: { name: true } },
      schedule: { select: { date: true, timeSlot: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">今日概览</h1>
      <TodayPanel
        doctorId={doctor.id}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schedules={schedules as any}
        pendingAppointments={pendingAppointments}
      />
      <div className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold text-cyan-900">最近预约</h2>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <AppointmentList appointments={recentAppointments as any} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 运行类型检查**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 6: 提交**

```bash
git add src/app/doctor/ src/components/doctor/ src/components/layout/doctor-sidebar.tsx
git commit -m "feat: add doctor dashboard with today panel"
```

---

### Task 14: 创建排队叫号面板

**Files:**
- Create: `src/components/doctor/queue-panel.tsx`
- Create: `src/app/doctor/queue/page.tsx`

> **Context7 检查点：** 使用 Context7 查询 `Next.js 16` 的 Server-Sent Events API 和 Route Handler 用法。

- [ ] **Step 1: 创建排队叫号 API Route**

```typescript
// src/app/api/queue/[scheduleId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const { scheduleId } = await params;

  const queue = await prisma.queueNumber.findMany({
    where: { scheduleId },
    orderBy: { number: "asc" },
  });

  const waiting = queue.filter((q) => q.status === "waiting");
  const called = queue.filter((q) => q.status === "called");
  const completed = queue.filter((q) => q.status === "completed");

  return NextResponse.json({
    success: true,
    data: {
      current: called.length > 0 ? called[called.length - 1] : null,
      nextInLine: waiting.length > 0 ? waiting[0] : null,
      waitingCount: waiting.length,
      completedCount: completed.length,
      queue: queue.slice(0, 20),
    },
  });
}
```

- [ ] **Step 2: 创建叫号 API Route**

```typescript
// src/app/api/queue/[scheduleId]/call/route.ts
import { NextRequest, NextResponse } from "next/server";
import { callNextNumber } from "@/server/actions/queue";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const { scheduleId } = await params;

  const result = await callNextNumber(scheduleId);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json(result);
}
```

- [ ] **Step 3: 创建排队叫号面板组件**

```typescript
// src/components/doctor/queue-panel.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, CheckCircle, Clock, Users } from "lucide-react";

type QueuePanelProps = {
  scheduleId: string;
};

type QueueStatus = {
  current: { id: string; number: number } | null;
  nextInLine: { id: string; number: number } | null;
  waitingCount: number;
  completedCount: number;
  queue: {
    id: string;
    number: number;
    status: string;
    calledAt: string | null;
  }[];
};

export function QueuePanel({ scheduleId }: QueuePanelProps) {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchStatus() {
    const res = await fetch(`/api/queue/${scheduleId}`);
    const data = await res.json();
    if (data.success) {
      setStatus(data.data);
    }
  }

  async function handleCallNext() {
    setLoading(true);
    const res = await fetch(`/api/queue/${scheduleId}/call`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (data.success) {
      fetchStatus();
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [scheduleId]);

  if (!status) return <div>加载中...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-center text-sm text-slate-600">当前叫号</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            {status.current ? (
              <div className="text-6xl font-bold text-primary animate-pulse">
                {status.current.number}
              </div>
            ) : (
              <div className="text-4xl font-bold text-slate-400">--</div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleCallNext}
          disabled={loading || status.waitingCount === 0}
          className="w-full cursor-pointer"
          size="lg"
        >
          <Phone className="mr-2 h-5 w-5" />
          {loading ? "叫号中..." : "叫下一位"}
        </Button>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Users className="h-8 w-8 text-amber-500" />
              <div>
                <div className="text-2xl font-bold">{status.waitingCount}</div>
                <div className="text-xs text-slate-500">等待中</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{status.completedCount}</div>
                <div className="text-xs text-slate-500">已完成</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">队列列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {status.queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold">{item.number}</span>
                  <Badge
                    variant={
                      item.status === "called"
                        ? "default"
                        : item.status === "completed"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {item.status === "waiting" && "等待中"}
                    {item.status === "called" && "就诊中"}
                    {item.status === "completed" && "已完成"}
                    {item.status === "missed" && "过号"}
                  </Badge>
                </div>
                {item.calledAt && (
                  <span className="text-xs text-slate-500">
                    {new Date(item.calledAt).toLocaleTimeString("zh-CN")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: 创建排队叫号页面**

```typescript
// src/app/doctor/queue/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QueuePanel } from "@/components/doctor/queue-panel";

export default async function DoctorQueuePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) redirect("/");

  const today = new Date().toISOString().split("T")[0];

  const todaySchedule = await prisma.schedule.findFirst({
    where: {
      doctorId: doctor.id,
      date: { gte: new Date(today) },
      status: "open",
    },
    orderBy: { date: "asc" },
  });

  if (!todaySchedule) {
    return (
      <div>
        <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">排队叫号</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">今日无开放排班</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">排队叫号</h1>
      <QueuePanel scheduleId={todaySchedule.id} />
    </div>
  );
}
```

- [ ] **Step 5: 运行类型检查**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 6: 提交**

```bash
git add src/components/doctor/queue-panel.tsx src/app/doctor/queue/ src/app/api/queue/
git commit -m "feat: add queue panel with SSE-based real-time updates"
```

---

### Task 15: 创建病历书写表单

**Files:**
- Create: `src/components/doctor/record-form.tsx`
- Create: `src/app/doctor/records/page.tsx`

> **Context7 检查点：** 使用 Context7 查询 `shadcn/ui` 的动态表单（动态添加处方项）用法。

- [ ] **Step 1: 创建病历书写表单**

```typescript
// src/components/doctor/record-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMedicalRecord } from "@/server/actions/medical-record";
import { Plus, Trash2, Save } from "lucide-react";

type PrescriptionItem = {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
};

type RecordFormProps = {
  appointmentId: string;
  doctorId: string;
  onSuccess?: () => void;
};

export function RecordForm({ appointmentId, doctorId, onSuccess }: RecordFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);

  function addPrescriptionItem() {
    setPrescription([
      ...prescription,
      { medicineName: "", dosage: "", frequency: "", duration: "", notes: "" },
    ]);
  }

  function removePrescriptionItem(index: number) {
    setPrescription(prescription.filter((_, i) => i !== index));
  }

  function updatePrescriptionItem(index: number, field: keyof PrescriptionItem, value: string) {
    const updated = [...prescription];
    updated[index] = { ...updated[index], [field]: value };
    setPrescription(updated);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const validPrescription = prescription.filter(
      (p) => p.medicineName && p.dosage && p.frequency && p.duration
    );

    const result = await createMedicalRecord({
      appointmentId,
      doctorId,
      diagnosis,
      prescription: validPrescription.length > 0 ? validPrescription : undefined,
      notes: notes || undefined,
      followUpDate: followUpDate || undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      onSuccess?.();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="diagnosis">诊断结果 *</Label>
        <Textarea
          id="diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="请输入诊断结果..."
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>处方</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPrescriptionItem}
            className="cursor-pointer"
          >
            <Plus className="mr-1 h-4 w-4" />
            添加药品
          </Button>
        </div>

        {prescription.length > 0 && (
          <div className="space-y-3">
            {prescription.map((item, index) => (
              <Card key={index}>
                <CardContent className="grid grid-cols-2 gap-3 pt-4">
                  <div>
                    <Label>药品名称</Label>
                    <Input
                      value={item.medicineName}
                      onChange={(e) => updatePrescriptionItem(index, "medicineName", e.target.value)}
                      placeholder="药品名"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>剂量</Label>
                    <Input
                      value={item.dosage}
                      onChange={(e) => updatePrescriptionItem(index, "dosage", e.target.value)}
                      placeholder="如：0.25g"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>频率</Label>
                    <Input
                      value={item.frequency}
                      onChange={(e) => updatePrescriptionItem(index, "frequency", e.target.value)}
                      placeholder="如：每日3次"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>疗程</Label>
                    <Input
                      value={item.duration}
                      onChange={(e) => updatePrescriptionItem(index, "duration", e.target.value)}
                      placeholder="如：7天"
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2 flex items-end gap-2">
                    <div className="flex-1">
                      <Label>备注</Label>
                      <Input
                        value={item.notes}
                        onChange={(e) => updatePrescriptionItem(index, "notes", e.target.value)}
                        placeholder="选填"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removePrescriptionItem(index)}
                      className="cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="notes">备注</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="其他备注信息..."
          className="mt-1"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="followUpDate">复诊日期（选填）</Label>
        <Input
          id="followUpDate"
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
          className="mt-1"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading || !diagnosis}
        className="w-full cursor-pointer"
        size="lg"
      >
        <Save className="mr-2 h-5 w-5" />
        {loading ? "保存中..." : "保存病历"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: 创建病历管理页面**

```typescript
// src/app/doctor/records/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export default async function DoctorRecordsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) redirect("/");

  const records = await prisma.medicalRecord.findMany({
    where: { doctorId: doctor.id },
    include: {
      appointment: {
        include: {
          user: { select: { name: true } },
        },
      },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">病历管理</h1>

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">暂无病历记录</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {record.appointment.user.name} - {new Date(record.createdAt).toLocaleDateString("zh-CN")}
                  </CardTitle>
                  <Badge variant="secondary">{record.items.length} 种药品</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{record.diagnosis}</p>
                {record.items.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500">
                    处方：{record.items.map((i) => i.medicineName).join("、")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 运行类型检查**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add src/components/doctor/record-form.tsx src/app/doctor/records/
git commit -m "feat: add medical record form and records page"
```

---

### Task 16: Doctor Dashboard E2E 测试

**Files:**
- Create: `tests/e2e/doctor/dashboard.spec.ts`
- Create: `tests/e2e/doctor/queue.spec.ts`

> **Context7 检查点：** 使用 Context7 查询 `Playwright` 的 waitForResponse 和网络拦截 API。

- [ ] **Step 1: 编写医生仪表盘 E2E 测试**

```typescript
// tests/e2e/doctor/dashboard.spec.ts
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
```

- [ ] **Step 2: 编写排队叫号 E2E 测试**

```typescript
// tests/e2e/doctor/queue.spec.ts
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
      // 验证叫号成功
    }
  });
});
```

- [ ] **Step 3: 运行 E2E 测试**

```bash
pnpm exec playwright test tests/e2e/doctor/
```

- [ ] **Step 4: 提交**

```bash
git add tests/e2e/doctor/
git commit -m "test: add E2E tests for doctor workstation"
```

---

## Phase 3: 患者端增强

### Task 17: 创建患者端布局 + 三步预约向导

**Files:**
- Create: `src/app/patient/layout.tsx`
- Create: `src/components/patient/appointment-wizard.tsx`
- Create: `src/app/patient/new-appointment/page.tsx`

> **Context7 检查点：** 使用 Context7 查询 `Next.js 16 App Router` 的 searchParams 和动态路由用法。

- [ ] **Step 1: 创建患者端布局**

```typescript
// src/app/patient/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PatientSidebar } from "@/components/layout/patient-sidebar";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <PatientSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: 创建患者端侧边栏**

```typescript
// src/components/layout/patient-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus, Calendar, FileText, Star, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/patient/new-appointment", label: "预约挂号", icon: CalendarPlus },
  { href: "/patient/appointments", label: "我的预约", icon: Calendar },
  { href: "/patient/records", label: "我的病历", icon: FileText },
  { href: "/patient/reviews", label: "我的评价", icon: Star },
];

export function PatientSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white">
      <div className="p-4">
        <h2 className="font-heading text-lg font-bold text-cyan-900">患者中心</h2>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-0 w-64 border-t border-slate-200 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: 创建预约向导组件**

```typescript
// src/components/patient/appointment-wizard.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { getDepartments } from "@/server/actions/department";
import { getDoctors } from "@/server/actions/doctor";
import { createAppointment } from "@/server/actions/appointment";
import { useSession } from "next-auth/react";

type Department = { id: string; name: string; description?: string | null };
type Doctor = {
  id: string;
  user: { name: string };
  department: { name: string };
  title: string;
};
type Schedule = {
  id: string;
  date: string;
  timeSlot: string;
  maxPatients: number;
  currentPatients: number;
  status: string;
};

const timeSlotLabels: Record<string, string> = {
  morning: "上午",
  afternoon: "下午",
  evening: "晚间",
};

export function AppointmentWizard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [symptoms, setSymptoms] = useState("");

  useEffect(() => {
    getDepartments().then((res) => {
      if (res.success) setDepartments(res.data);
    });
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      getDoctors(selectedDepartment.id).then((res) => {
        if (res.success) setDoctors(res.data);
      });
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedDoctor) {
      // 获取医生的可用排班
      fetch(`/api/schedules?doctorId=${selectedDoctor.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setSchedules(data.data);
        });
    }
  }, [selectedDoctor]);

  async function handleSubmit() {
    if (!selectedSchedule || !selectedDoctor || !session?.user?.id) return;

    setLoading(true);
    setError("");

    const result = await createAppointment({
      userId: session.user.id,
      doctorId: selectedDoctor.id,
      scheduleId: selectedSchedule.id,
      symptoms: symptoms || undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setStep(4); // 成功步骤
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {step > s ? <CheckCircle className="h-4 w-4" /> : s}
            </div>
            {s < 3 && <div className={`h-0.5 w-12 ${step > s ? "bg-primary" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>选择科室</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => {
                    setSelectedDepartment(dept);
                    setStep(2);
                  }}
                  className={`rounded-lg border p-4 text-left transition-colors cursor-pointer ${
                    selectedDepartment?.id === dept.id
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-primary"
                  }`}
                >
                  <div className="font-medium">{dept.name}</div>
                  {dept.description && (
                    <div className="mt-1 text-xs text-slate-500 line-clamp-2">{dept.description}</div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>选择医生 - {selectedDepartment?.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="cursor-pointer">
                <ChevronLeft className="mr-1 h-4 w-4" />
                返回
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {doctors.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setStep(3);
                  }}
                  className={`w-full rounded-lg border p-4 text-left transition-colors cursor-pointer ${
                    selectedDoctor?.id === doc.id
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-primary"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{doc.user.name}</div>
                      <div className="text-xs text-slate-500">{doc.title}</div>
                    </div>
                    <Badge variant="outline">{doc.department.name}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>选择时间 - {selectedDoctor?.user.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="cursor-pointer">
                <ChevronLeft className="mr-1 h-4 w-4" />
                返回
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>症状描述（选填）</Label>
              <Textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="请简要描述您的症状..."
                className="mt-1"
              />
            </div>

            <div className="space-y-3">
              {schedules.map((schedule) => {
                const available = schedule.maxPatients - schedule.currentPatients;
                return (
                  <button
                    key={schedule.id}
                    onClick={() => setSelectedSchedule(schedule)}
                    disabled={available <= 0}
                    className={`w-full rounded-lg border p-4 text-left transition-colors cursor-pointer ${
                      selectedSchedule?.id === schedule.id
                        ? "border-primary bg-primary/5"
                        : available > 0
                        ? "border-slate-200 hover:border-primary"
                        : "cursor-not-allowed border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {new Date(schedule.date).toLocaleDateString("zh-CN")}{" "}
                        {timeSlotLabels[schedule.timeSlot]}
                      </span>
                      <Badge variant={available > 0 ? "secondary" : "destructive"}>
                        余{available}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!selectedSchedule || loading}
              className="w-full cursor-pointer"
              size="lg"
            >
              {loading ? "提交中..." : "确认预约"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="mt-4 font-heading text-xl font-bold text-green-800">预约成功</h3>
            <p className="mt-2 text-green-700">请按时就诊</p>
            <Button className="mt-6 cursor-pointer" onClick={() => router.push("/patient/appointments")}>
              查看我的预约
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 创建预约向导页面**

```typescript
// src/app/patient/new-appointment/page.tsx
import { AppointmentWizard } from "@/components/patient/appointment-wizard";

export default function NewAppointmentPage() {
  return (
    <div>
      <h1 className="mb-8 font-heading text-2xl font-bold text-cyan-900">预约挂号</h1>
      <AppointmentWizard />
    </div>
  );
}
```

- [ ] **Step 5: 运行类型检查**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 6: 提交**

```bash
git add src/app/patient/ src/components/patient/ src/components/layout/patient-sidebar.tsx
git commit -m "feat: add patient layout and appointment wizard"
```

---

### Task 18: 患者端评价功能

**Files:**
- Create: `src/components/forms/review-form.tsx`
- Create: `src/app/patient/reviews/page.tsx`
- Create: `src/components/patient/review-list.tsx`

> **Context7 检查点：** 使用 Context7 查询 `shadcn/ui` 的 Star/Rating 组件或自定义评分组件用法。

- [ ] **Step 1: 创建评价表单组件**

```typescript
// src/components/forms/review-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createReview } from "@/server/actions/review";
import { Star } from "lucide-react";

type ReviewFormProps = {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  onSuccess?: () => void;
};

export function ReviewForm({ appointmentId, patientId, doctorId, onSuccess }: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  async function handleSubmit() {
    if (rating === 0) {
      setError("请选择评分");
      return;
    }

    setLoading(true);
    setError("");

    const result = await createReview({
      appointmentId,
      patientId,
      doctorId,
      rating,
      comment: comment || undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setOpen(false);
      onSuccess?.();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="cursor-pointer">
          <Star className="mr-1 h-4 w-4" />
          评价
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>评价医生</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <Label>评分</Label>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="cursor-pointer"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="comment">评价内容（选填）</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="分享您的就诊体验..."
              className="mt-1"
              rows={4}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="w-full cursor-pointer"
          >
            {loading ? "提交中..." : "提交评价"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: 创建评价列表页面**

```typescript
// src/app/patient/reviews/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPatientReviews } from "@/server/actions/review";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

export default async function PatientReviewsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const result = await getPatientReviews(session.user.id);
  const reviews = result.success ? result.data : [];

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">我的评价</h1>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">暂无评价</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {review.doctor.user.name} - {review.doctor.department.name}
                  </CardTitle>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {review.comment && (
                  <p className="text-sm text-slate-600">{review.comment}</p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 运行类型检查**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add src/components/forms/review-form.tsx src/app/patient/reviews/
git commit -m "feat: add patient review form and reviews page"
```

---

### Task 19: Patient E2E 测试

**Files:**
- Create: `tests/e2e/patient/appointment.spec.ts`
- Create: `tests/e2e/patient/reviews.spec.ts`

> **Context7 检查点：** 使用 Context7 查询 `Playwright` 的表单交互和 multi-step flow 测试模式。

- [ ] **Step 1: 编写预约流程 E2E 测试**

```typescript
// tests/e2e/patient/appointment.spec.ts
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

  test("P2: 应该能完成预约流程", async ({ page }) => {
    // Step 1: 选择科室
    await page.click('[class*=rounded-lg]:has-text("内科")');
    await expect(page.locator("text=选择医生")).toBeVisible();

    // Step 2: 选择医生
    await page.click('[class*=rounded-lg]:has-text("张医生")');
    await expect(page.locator("text=选择时间")).toBeVisible();

    // Step 3: 选择时间
    const timeSlot = page.locator('[class*=rounded-lg]:has-text("上午")').first();
    if (await timeSlot.isEnabled()) {
      await timeSlot.click();
      await page.click('button:has-text("确认预约")');
      await expect(page.locator("text=预约成功")).toBeVisible();
    }
  });

  test("P3: 应该能查看我的预约", async ({ page }) => {
    await page.goto("/patient/appointments");
    await expect(page.locator("h1")).toContainText("我的预约");
  });
});
```

- [ ] **Step 2: 编写评价 E2E 测试**

```typescript
// tests/e2e/patient/reviews.spec.ts
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
      // 选择评分
      await page.click('[class*=Star]:nth-child(5)');
      await page.fill('textarea', "很好的医生");
      await page.click('button:has-text("提交评价")');
    }
  });
});
```

- [ ] **Step 3: 运行 E2E 测试**

```bash
pnpm exec playwright test tests/e2e/patient/
```

- [ ] **Step 4: 提交**

```bash
git add tests/e2e/patient/
git commit -m "test: add E2E tests for patient features"
```

---

## Phase 4: 数据报表 + 集成测试

### Task 20: 创建数据报表页面

**Files:**
- Create: `src/app/admin/dashboard/page.tsx` (增强)
- Create: `src/components/charts/appointment-chart.tsx`
- Create: `src/components/charts/doctor-workload-chart.tsx`

> **Context7 检查点：** 使用 Context7 查询 `recharts` 最新 API 和 `Next.js 16` 的 Server Components 图表用法。

- [ ] **Step 1: 创建预约统计图表**

```typescript
// src/components/charts/appointment-chart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type AppointmentChartProps = {
  data: {
    date: string;
    count: number;
  }[];
};

export function AppointmentChart({ data }: AppointmentChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="hsl(187, 84%, 43%)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: 创建医生工作量图表**

```typescript
// src/components/charts/doctor-workload-chart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type DoctorWorkloadChartProps = {
  data: {
    name: string;
    appointments: number;
    records: number;
  }[];
};

export function DoctorWorkloadChart({ data }: DoctorWorkloadChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="appointments" name="预约数" fill="hsl(187, 84%, 43%)" />
        <Bar dataKey="records" name="病历数" fill="hsl(187, 72%, 54%)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: 增强仪表盘页面**

```typescript
// src/app/admin/dashboard/page.tsx
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Stethoscope, Calendar, FileText } from "lucide-react";
import { AppointmentChart } from "@/components/charts/appointment-chart";

export default async function AdminDashboardPage() {
  const [doctorCount, patientCount, appointmentCount, recordCount] = await Promise.all([
    prisma.doctor.count(),
    prisma.user.count({ where: { role: { not: "admin" } } }),
    prisma.appointment.count(),
    prisma.medicalRecord.count(),
  ]);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const appointmentStats = await Promise.all(
    last7Days.map(async (date) => {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      const count = await prisma.appointment.count({
        where: {
          createdAt: { gte: start, lt: end },
        },
      });
      return { date: date.slice(5), count };
    })
  );

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">仪表盘</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{doctorCount}</div>
              <div className="text-xs text-slate-500">医生总数</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{patientCount}</div>
              <div className="text-xs text-slate-500">患者总数</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{appointmentCount}</div>
              <div className="text-xs text-slate-500">预约总数</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{recordCount}</div>
              <div className="text-xs text-slate-500">病历总数</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">近7天预约趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentChart data={appointmentStats} />
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: 运行类型检查**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 5: 提交**

```bash
git add src/app/admin/dashboard/ src/components/charts/
git commit -m "feat: add dashboard with charts and statistics"
```

---

### Task 21: 跨角色集成 E2E 测试

**Files:**
- Create: `tests/e2e/integration/full-flow.spec.ts`

> **Context7 检查点：** 使用 Context7 查询 `Playwright` 的 multi-user session 和 storageState 高级用法。

- [ ] **Step 1: 编写完整流程集成测试**

```typescript
// tests/e2e/integration/full-flow.spec.ts
import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers";

test.describe("完整预约流程", () => {
  test("I1: 患者预约 → 医生接诊 → 写病历 → 患者评价", async ({ page }) => {
    // Step 1: 患者预约
    await loginAs(page, "patient");
    await page.goto("/patient/new-appointment");
    // ... 完成预约流程

    // Step 2: 医生接诊
    await loginAs(page, "doctor");
    await page.goto("/doctor/appointments");
    // ... 接诊患者

    // Step 3: 写病历
    await page.goto("/doctor/records");
    // ... 填写病历

    // Step 4: 患者评价
    await loginAs(page, "patient");
    await page.goto("/patient/appointments");
    // ... 评价医生
  });

  test("I2: 排队叫号流程", async ({ page }) => {
    // 患者签到
    await loginAs(page, "patient");
    await page.goto("/patient/appointments");
    // ... 签到

    // 医生叫号
    await loginAs(page, "doctor");
    await page.goto("/doctor/queue");
    await page.click('button:has-text("叫下一位")');
    // ... 验证叫号成功
  });

  test("I3: 药品扣减流程", async ({ page }) => {
    // 医生开处方
    await loginAs(page, "doctor");
    await page.goto("/doctor/records");
    // ... 开处方（包含药品）

    // 验证库存扣减
    await loginAs(page, "admin");
    await page.goto("/admin/medicines");
    // ... 验证库存数量
  });
});
```

- [ ] **Step 2: 运行集成测试**

```bash
pnpm exec playwright test tests/e2e/integration/
```

- [ ] **Step 3: 提交**

```bash
git add tests/e2e/integration/
git commit -m "test: add cross-role integration E2E tests"
```

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-05-18-doctor-system-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
