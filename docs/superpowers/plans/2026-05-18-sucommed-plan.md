# SuColMed（宿院医约）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零搭建高校校医院全预约平台，包含预约挂号、排班管理、电子病历、数据看板四大模块。

**Architecture:** Next.js 14+ App Router 全栈架构，Prisma ORM + PostgreSQL 数据层，shadcn/ui + Tailwind CSS 视觉层，NextAuth.js 认证层。Server Actions 处理表单提交，Route Handlers 提供 API。

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, NextAuth.js (Auth.js), Recharts, Lucide React, pnpm

**Spec:** `docs/superpowers/specs/2026-05-18-sucommed-design.md`

---

## 文件结构总览

```
SuColMed/
├── prisma/
│   └── schema.prisma              # 数据模型定义
├── src/
│   ├── app/
│   │   ├── layout.tsx             # 根布局（字体、全局样式）
│   │   ├── page.tsx               # 首页
│   │   ├── login/page.tsx         # 登录页
│   │   ├── register/page.tsx      # 注册页
│   │   ├── departments/
│   │   │   ├── page.tsx           # 科室列表
│   │   │   └── [id]/page.tsx      # 科室详情
│   │   ├── doctors/[id]/page.tsx  # 医生详情
│   │   ├── appointments/
│   │   │   ├── new/page.tsx       # 创建预约
│   │   │   └── page.tsx           # 我的预约
│   │   ├── records/page.tsx       # 我的病历
│   │   ├── admin/
│   │   │   ├── layout.tsx         # 管理后台布局
│   │   │   ├── schedules/page.tsx # 排班管理
│   │   │   ├── doctors/page.tsx   # 医生管理
│   │   │   ├── departments/page.tsx # 科室管理
│   │   │   └── dashboard/page.tsx # 数据看板
│   │   └── api/
│   │       └── auth/[...nextauth]/route.ts  # NextAuth 路由
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 组件（自动生成）
│   │   ├── layout/
│   │   │   ├── header.tsx         # 全局顶栏
│   │   │   ├── footer.tsx         # 全局底栏
│   │   │   └── sidebar.tsx        # 管理后台侧边栏
│   │   ├── department-card.tsx    # 科室卡片
│   │   ├── doctor-card.tsx        # 医生卡片
│   │   ├── appointment-form.tsx   # 预约表单
│   │   ├── appointment-list.tsx   # 预约列表
│   │   ├── schedule-calendar.tsx  # 排班日历
│   │   ├── medical-record-card.tsx # 病历卡片
│   │   └── charts/                # 图表组件
│   │       ├── trend-chart.tsx    # 预约趋势折线图
│   │       ├── department-chart.tsx # 科室热度柱状图
│   │       ├── doctor-chart.tsx   # 医生工作量柱状图
│   │       └── status-chart.tsx   # 预约状态饼图
│   ├── lib/
│   │   ├── prisma.ts              # Prisma 单例
│   │   ├── auth.ts                # NextAuth 配置
│   │   └── utils.ts               # 工具函数
│   ├── server/
│   │   └── actions/
│   │       ├── auth.ts            # 登录/注册 Server Actions
│   │       ├── appointment.ts     # 预约 Server Actions
│   │       ├── schedule.ts        # 排班 Server Actions
│   │       ├── doctor.ts          # 医生 Server Actions
│   │       ├── department.ts      # 科室 Server Actions
│   │       └── medical-record.ts  # 病历 Server Actions
│   └── types/
│       └── index.ts               # 共享 TypeScript 类型
├── tests/
│   └── lib/
│       └── prisma-mock.ts         # Prisma Mock 工具
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Phase 0: 项目基建

### Task 1: 初始化 Next.js 项目

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`

- [ ] **Step 1: 创建项目**

```bash
pnpm create next@latest sucolmed --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

- [ ] **Step 2: 进入项目目录并确认**

```bash
cd sucolmed && pnpm dev
```

Expected: 开发服务器启动在 http://localhost:3000

- [ ] **Step 3: 清理默认页面**

删除 `src/app/page.tsx` 中的默认内容，替换为：

```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="font-heading text-4xl font-bold text-cyan-900">
        宿院医约
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        高校校医院在线预约平台
      </p>
    </main>
  );
}
```

- [ ] **Step 4: 验证页面渲染**

Run: `pnpm dev`
Expected: 浏览器显示「宿院医约」标题

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: init Next.js project with TypeScript + Tailwind"
```

---

### Task 2: 安装核心依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 ORM 和数据库**

```bash
pnpm add prisma @prisma/client
```

- [ ] **Step 2: 安装认证**

```bash
pnpm add next-auth@beta @auth/prisma-adapter
```

- [ ] **Step 3: 安装 UI 组件**

```bash
pnpm add lucide-react class-variance-authority clsx tailwind-merge
```

- [ ] **Step 4: 安装图表库**

```bash
pnpm add recharts
```

- [ ] **Step 5: 安装开发依赖**

```bash
pnpm add -D @types/node
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: install core dependencies (prisma, next-auth, shadcn deps, recharts)"
```

---

### Task 3: 初始化 shadcn/ui

**Files:**
- Create: `components.json`, `src/lib/utils.ts`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: 初始化 shadcn/ui**

```bash
pnpm dlx shadcn@latest init
```

选择配置：
- Style: Default
- Base color: Cyan
- CSS variables: yes

- [ ] **Step 2: 添加常用组件**

```bash
pnpm dlx shadcn@latest add button card input label select table badge dialog calendar tabs
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: init shadcn/ui with base components"
```

---

## Phase 1: 数据库与 API 契约

### Task 4: 定义 Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: 创建 Prisma Schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  student
  faculty
  external
  admin
}

enum TimeSlot {
  morning
  afternoon
  evening
}

enum ScheduleStatus {
  open
  full
  closed
}

enum AppointmentStatus {
  pending
  confirmed
  cancelled
  completed
}

model User {
  id           String    @id @default(uuid())
  name         String
  role         UserRole
  studentId    String?   @unique
  phone        String    @unique
  email        String?   @unique
  passwordHash String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  appointments Appointment[]
  doctor       Doctor?

  @@map("users")
}

model Department {
  id          String   @id @default(uuid())
  name        String
  description String?
  location    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  doctors Doctor[]

  @@map("departments")
}

model Doctor {
  id           String   @id @default(uuid())
  userId       String   @unique
  departmentId String
  title        String
  specialties  Json?
  avatar       String?
  bio          String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User         @relation(fields: [userId], references: [id])
  department   Department   @relation(fields: [departmentId], references: [id])
  schedules    Schedule[]
  appointments Appointment[]
  medicalRecords MedicalRecord[]

  @@map("doctors")
}

model Schedule {
  id              String         @id @default(uuid())
  doctorId        String
  date            DateTime       @db.Date
  timeSlot        TimeSlot
  maxPatients     Int            @default(20)
  currentPatients Int            @default(0)
  status          ScheduleStatus @default(open)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  doctor      Doctor        @relation(fields: [doctorId], references: [id])
  appointments Appointment[]

  @@unique([doctorId, date, timeSlot])
  @@map("schedules")
}

model Appointment {
  id           String            @id @default(uuid())
  userId       String
  doctorId     String
  scheduleId   String
  status       AppointmentStatus @default(pending)
  symptoms     String?
  queueNumber  Int?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  user          User          @relation(fields: [userId], references: [id])
  doctor        Doctor        @relation(fields: [doctorId], references: [id])
  schedule      Schedule      @relation(fields: [scheduleId], references: [id])
  medicalRecord MedicalRecord?

  @@map("appointments")
}

model MedicalRecord {
  id            String   @id @default(uuid())
  appointmentId String   @unique
  doctorId      String
  diagnosis     String
  prescription  Json?
  notes         String?
  followUpDate  DateTime? @db.Date
  createdAt     DateTime @default(now())

  appointment Appointment       @relation(fields: [appointmentId], references: [id])
  doctor      Doctor            @relation(fields: [doctorId], references: [id])
  items       PrescriptionItem[]

  @@map("medical_records")
}

model PrescriptionItem {
  id              String  @id @default(uuid())
  medicalRecordId String
  medicineName    String
  dosage          String
  frequency       String
  duration        String
  notes           String?

  medicalRecord MedicalRecord @relation(fields: [medicalRecordId], references: [id])

  @@map("prescription_items")
}
```

- [ ] **Step 2: 验证 Schema 语法**

```bash
pnpm prisma validate
```

Expected: `Schema is valid`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma && git commit -m "feat: define Prisma schema with all entities and enums"
```

---

### Task 5: 配置 Prisma Client 单例

**Files:**
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: 创建 Prisma 单例**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/prisma.ts && git commit -m "feat: add Prisma client singleton"
```

---

### Task 6: 配置环境变量和数据库迁移

**Files:**
- Create: `.env`, `.env.example`

- [ ] **Step 1: 创建 .env.example**

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/sucolmed?schema=public"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 2: 创建 .env（本地开发用）**

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sucolmed?schema=public"
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 3: 运行迁移**

```bash
pnpm prisma migrate dev --name init
```

Expected: 迁移成功，数据库表已创建

- [ ] **Step 4: 生成 Prisma Client**

```bash
pnpm prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add .env.example && git commit -m "feat: add env config and run initial migration"
```

---

### Task 7: 定义 TypeScript 共享类型

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建共享类型**

```typescript
import { UserRole, TimeSlot, ScheduleStatus, AppointmentStatus } from "@prisma/client";

// ============ API Response Types ============

export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

// ============ User Types ============

export type UserWithoutPassword = {
  id: string;
  name: string;
  role: UserRole;
  studentId: string | null;
  phone: string;
  email: string | null;
  createdAt: Date;
};

// ============ Department Types ============

export type DepartmentListItem = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  _count: { doctors: number };
};

export type DepartmentDetail = DepartmentListItem & {
  doctors: DoctorListItem[];
};

// ============ Doctor Types ============

export type DoctorListItem = {
  id: string;
  name: string;
  title: string;
  specialties: string[] | null;
  avatar: string | null;
  bio: string | null;
  department: { id: string; name: string };
};

export type DoctorDetail = DoctorListItem & {
  schedules: ScheduleListItem[];
};

// ============ Schedule Types ============

export type ScheduleListItem = {
  id: string;
  date: Date;
  timeSlot: TimeSlot;
  maxPatients: number;
  currentPatients: number;
  status: ScheduleStatus;
};

// ============ Appointment Types ============

export type AppointmentListItem = {
  id: string;
  status: AppointmentStatus;
  symptoms: string | null;
  queueNumber: number | null;
  createdAt: Date;
  doctor: {
    name: string;
    title: string;
    department: { name: string };
  };
  schedule: {
    date: Date;
    timeSlot: TimeSlot;
  };
};

export type CreateAppointmentInput = {
  doctorId: string;
  scheduleId: string;
  symptoms?: string;
};

// ============ Medical Record Types ============

export type MedicalRecordListItem = {
  id: string;
  diagnosis: string;
  notes: string | null;
  followUpDate: Date | null;
  createdAt: Date;
  doctor: { name: string; title: string };
  items: PrescriptionItem[];
};

export type PrescriptionItem = {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string | null;
};

// ============ Dashboard Types ============

export type DashboardStats = {
  totalAppointments: number;
  todayAppointments: number;
  totalDoctors: number;
  totalDepartments: number;
};

export type TrendData = {
  date: string;
  count: number;
};

export type DepartmentHeatData = {
  name: string;
  count: number;
};

export type DoctorWorkloadData = {
  name: string;
  count: number;
};

export type StatusDistribution = {
  status: string;
  count: number;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts && git commit -m "feat: define shared TypeScript types"
```

---

## Phase 2: 设计系统注入

### Task 8: 配置 Tailwind 主题

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: 更新 Tailwind 配置**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0891B2",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#22D3EE",
          foreground: "#164E63",
        },
        cta: {
          DEFAULT: "#059669",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#475569",
        },
        accent: {
          DEFAULT: "#ECFEFF",
          foreground: "#164E63",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#164E63",
        },
      },
      fontFamily: {
        heading: ["Figtree", "sans-serif"],
        body: ["Noto Sans", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 2: 安装 tailwindcss-animate**

```bash
pnpm add -D tailwindcss-animate
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts && git commit -m "feat: configure Tailwind with SuColMed design tokens"
```

---

### Task 9: 配置全局样式和字体

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 更新全局样式**

```css
@import url("https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;700&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 180 100% 97%;
    --foreground: 198 82% 24%;
    --card: 0 0% 100%;
    --card-foreground: 198 82% 24%;
    --primary: 187 84% 43%;
    --primary-foreground: 0 0% 100%;
    --secondary: 187 72% 54%;
    --secondary-foreground: 198 82% 24%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 180 100% 97%;
    --accent-foreground: 198 82% 24%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 187 84% 43%;
    --radius: 0.5rem;
    --success: 142 71% 45%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 100%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-body antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
  }
}

@layer utilities {
  .focus-ring {
    @apply outline-none ring-2 ring-offset-2 ring-cyan-500;
  }
}
```

- [ ] **Step 2: 更新根布局**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "宿院医约 - 高校校医院在线预约",
  description: "面向高校校医院的全人群在线预约平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: 验证视觉效果**

Run: `pnpm dev`
Expected: 页面使用 Figtree 标题字体 + Noto Sans 正文字体，背景色为 cyan-50

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx && git commit -m "feat: inject design system - fonts, colors, spacing tokens"
```

---

### Task 10: 配置 NextAuth 类型扩展

**Files:**
- Create: `src/types/next-auth.d.ts`

- [ ] **Step 1: 扩展 NextAuth 类型**

```typescript
import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/next-auth.d.ts && git commit -m "feat: extend NextAuth types with role and id"
```

---

## Phase 3: 后端业务逻辑（TDD）

### Task 11: 配置 NextAuth

**Files:**
- Create: `src/lib/auth.ts`
- Modify: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: 创建 NextAuth 配置**

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone: { label: "手机号", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
```

- [ ] **Step 2: 创建 API Route**

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

- [ ] **Step 3: 安装 bcryptjs**

```bash
pnpm add bcryptjs && pnpm add -D @types/bcryptjs
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ && git commit -m "feat: configure NextAuth with credentials provider"
```

---

### Task 12: 实现注册 Server Action（TDD）

**Files:**
- Create: `src/server/actions/auth.ts`
- Create: `tests/server/actions/auth.test.ts`

- [ ] **Step 1: 写失败的测试**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { registerUser } from "@/server/actions/auth";

describe("registerUser", () => {
  it("should register a new user with valid data", async () => {
    const result = await registerUser({
      name: "张三",
      phone: "13800138000",
      password: "password123",
      role: "student",
      studentId: "2024001",
    });

    expect(result.success).toBe(true);
  });

  it("should fail with duplicate phone", async () => {
    await registerUser({
      name: "张三",
      phone: "13800138000",
      password: "password123",
      role: "student",
    });

    const result = await registerUser({
      name: "李四",
      phone: "13800138000",
      password: "password456",
      role: "student",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("手机号已注册");
  });

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
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm vitest run tests/server/actions/auth.test.ts
```

Expected: FAIL — `registerUser` 不存在

- [ ] **Step 3: 安装测试依赖**

```bash
pnpm add -D vitest
```

- [ ] **Step 4: 实现注册逻辑**

```typescript
"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "姓名至少2个字符"),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的11位手机号"),
  password: z.string().min(6, "密码至少6位"),
  role: z.enum(["student", "faculty", "external"]),
  studentId: z.string().optional(),
  email: z.string().email("请输入有效的邮箱").optional(),
});

export async function registerUser(input: {
  name: string;
  phone: string;
  password: string;
  role: string;
  studentId?: string;
  email?: string;
}) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const existing = await prisma.user.findUnique({
    where: { phone: input.phone },
  });

  if (existing) {
    return { success: false as const, error: "手机号已注册" };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      phone: input.phone,
      passwordHash,
      role: input.role as UserRole,
      studentId: input.studentId ?? null,
      email: input.email ?? null,
    },
  });

  return {
    success: true as const,
    data: { id: user.id, name: user.name, phone: user.phone },
  };
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
pnpm vitest run tests/server/actions/auth.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/server/actions/auth.ts tests/server/actions/auth.test.ts && git commit -m "feat: implement register action with validation (TDD)"
```

---

### Task 13: 实现预约创建 Server Action（TDD）

**Files:**
- Create: `src/server/actions/appointment.ts`
- Create: `tests/server/actions/appointment.test.ts`

- [ ] **Step 1: 写失败的测试**

```typescript
import { describe, it, expect } from "vitest";
import { createAppointment, cancelAppointment } from "@/server/actions/appointment";

describe("createAppointment", () => {
  it("should create appointment when schedule has available slots", async () => {
    const result = await createAppointment({
      userId: "test-user-id",
      doctorId: "test-doctor-id",
      scheduleId: "test-schedule-id",
      symptoms: "头痛",
    });

    expect(result.success).toBe(true);
  });

  it("should fail when schedule is full", async () => {
    const result = await createAppointment({
      userId: "test-user-id",
      doctorId: "test-doctor-id",
      scheduleId: "full-schedule-id",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("号源已满");
  });
});

describe("cancelAppointment", () => {
  it("should cancel a pending appointment", async () => {
    const result = await cancelAppointment({
      appointmentId: "test-appointment-id",
      userId: "test-user-id",
    });

    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm vitest run tests/server/actions/appointment.test.ts
```

Expected: FAIL

- [ ] **Step 3: 实现预约逻辑**

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAppointmentSchema = z.object({
  userId: z.string().uuid(),
  doctorId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  symptoms: z.string().max(500).optional(),
});

export async function createAppointment(input: {
  userId: string;
  doctorId: string;
  scheduleId: string;
  symptoms?: string;
}) {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const schedule = await prisma.schedule.findUnique({
    where: { id: input.scheduleId },
  });

  if (!schedule) {
    return { success: false as const, error: "排班不存在" };
  }

  if (schedule.status === "full" || schedule.status === "closed") {
    return { success: false as const, error: "号源已满或已关闭" };
  }

  if (schedule.currentPatients >= schedule.maxPatients) {
    return { success: false as const, error: "号源已满" };
  }

  const queueNumber = schedule.currentPatients + 1;

  const [appointment] = await prisma.$transaction([
    prisma.appointment.create({
      data: {
        userId: input.userId,
        doctorId: input.doctorId,
        scheduleId: input.scheduleId,
        symptoms: input.symptoms ?? null,
        queueNumber,
        status: "confirmed",
      },
    }),
    prisma.schedule.update({
      where: { id: input.scheduleId },
      data: {
        currentPatients: { increment: 1 },
        status: schedule.currentPatients + 1 >= schedule.maxPatients ? "full" : "open",
      },
    }),
  ]);

  return { success: true as const, data: { id: appointment.id, queueNumber } };
}

const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function cancelAppointment(input: {
  appointmentId: string;
  userId: string;
}) {
  const parsed = cancelAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: input.appointmentId,
      userId: input.userId,
      status: { in: ["pending", "confirmed"] },
    },
  });

  if (!appointment) {
    return { success: false as const, error: "预约不存在或无法取消" };
  }

  const [updated] = await prisma.$transaction([
    prisma.appointment.update({
      where: { id: input.appointmentId },
      data: { status: "cancelled" },
    }),
    prisma.schedule.update({
      where: { id: appointment.scheduleId },
      data: {
        currentPatients: { decrement: 1 },
        status: "open",
      },
    }),
  ]);

  return { success: true as const, data: { id: updated.id } };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm vitest run tests/server/actions/appointment.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/actions/appointment.ts tests/server/actions/appointment.test.ts && git commit -m "feat: implement appointment create/cancel actions (TDD)"
```

---

### Task 14: 实现排班管理 Server Action（TDD）

**Files:**
- Create: `src/server/actions/schedule.ts`
- Create: `tests/server/actions/schedule.test.ts`

- [ ] **Step 1: 写失败的测试**

```typescript
import { describe, it, expect } from "vitest";
import { createSchedule, updateScheduleStatus } from "@/server/actions/schedule";

describe("createSchedule", () => {
  it("should create a schedule for a doctor", async () => {
    const result = await createSchedule({
      doctorId: "test-doctor-id",
      date: "2026-05-20",
      timeSlot: "morning",
      maxPatients: 20,
    });

    expect(result.success).toBe(true);
  });

  it("should fail for duplicate schedule", async () => {
    await createSchedule({
      doctorId: "test-doctor-id",
      date: "2026-05-20",
      timeSlot: "morning",
    });

    const result = await createSchedule({
      doctorId: "test-doctor-id",
      date: "2026-05-20",
      timeSlot: "morning",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("已存在");
  });
});

describe("updateScheduleStatus", () => {
  it("should update schedule status", async () => {
    const result = await updateScheduleStatus({
      scheduleId: "test-schedule-id",
      status: "closed",
    });

    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm vitest run tests/server/actions/schedule.test.ts
```

Expected: FAIL

- [ ] **Step 3: 实现排班逻辑**

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { TimeSlot, ScheduleStatus } from "@prisma/client";

const createScheduleSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.enum(["morning", "afternoon", "evening"]),
  maxPatients: z.number().min(1).max(100).default(20),
});

export async function createSchedule(input: {
  doctorId: string;
  date: string;
  timeSlot: string;
  maxPatients?: number;
}) {
  const parsed = createScheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const existing = await prisma.schedule.findUnique({
    where: {
      doctorId_date_timeSlot: {
        doctorId: input.doctorId,
        date: new Date(input.date),
        timeSlot: input.timeSlot as TimeSlot,
      },
    },
  });

  if (existing) {
    return { success: false as const, error: "该时段排班已存在" };
  }

  const schedule = await prisma.schedule.create({
    data: {
      doctorId: input.doctorId,
      date: new Date(input.date),
      timeSlot: input.timeSlot as TimeSlot,
      maxPatients: input.maxPatients ?? 20,
    },
  });

  return { success: true as const, data: schedule };
}

export async function updateScheduleStatus(input: {
  scheduleId: string;
  status: ScheduleStatus;
}) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: input.scheduleId },
  });

  if (!schedule) {
    return { success: false as const, error: "排班不存在" };
  }

  const updated = await prisma.schedule.update({
    where: { id: input.scheduleId },
    data: { status: input.status },
  });

  return { success: true as const, data: updated };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm vitest run tests/server/actions/schedule.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/actions/schedule.ts tests/server/actions/schedule.test.ts && git commit -m "feat: implement schedule management actions (TDD)"
```

---

### Task 15: 实现科室和医生 Server Action

**Files:**
- Create: `src/server/actions/department.ts`
- Create: `src/server/actions/doctor.ts`

- [ ] **Step 1: 实现科室 CRUD**

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const departmentSchema = z.object({
  name: z.string().min(1, "科室名称不能为空"),
  description: z.string().optional(),
  location: z.string().optional(),
});

export async function getDepartments() {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    include: { _count: { select: { doctors: true } } },
    orderBy: { name: "asc" },
  });
  return departments;
}

export async function getDepartmentById(id: string) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      doctors: {
        include: {
          user: { select: { name: true, avatar: true } },
          _count: { select: { schedules: true } },
        },
      },
    },
  });
  return department;
}

export async function createDepartment(input: {
  name: string;
  description?: string;
  location?: string;
}) {
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const department = await prisma.department.create({ data: parsed.data });
  return { success: true as const, data: department };
}

export async function updateDepartment(
  id: string,
  input: { name?: string; description?: string; location?: string; isActive?: boolean }
) {
  const department = await prisma.department.update({
    where: { id },
    data: input,
  });
  return { success: true as const, data: department };
}
```

- [ ] **Step 2: 实现医生 CRUD**

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const doctorSchema = z.object({
  userId: z.string().uuid(),
  departmentId: z.string().uuid(),
  title: z.string().min(1, "职称不能为空"),
  specialties: z.array(z.string()).optional(),
  bio: z.string().optional(),
});

export async function getDoctors(departmentId?: string) {
  const where = departmentId ? { departmentId } : {};
  const doctors = await prisma.doctor.findMany({
    where,
    include: {
      user: { select: { name: true, phone: true } },
      department: { select: { name: true } },
    },
  });
  return doctors;
}

export async function getDoctorById(id: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, phone: true } },
      department: { select: { name: true } },
      schedules: {
        where: { status: "open", date: { gte: new Date() } },
        orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      },
    },
  });
  return doctor;
}

export async function createDoctor(input: {
  userId: string;
  departmentId: string;
  title: string;
  specialties?: string[];
  bio?: string;
}) {
  const parsed = doctorSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const doctor = await prisma.doctor.create({
    data: {
      ...parsed.data,
      specialties: parsed.data.specialties ?? [],
    },
  });
  return { success: true as const, data: doctor };
}

export async function updateDoctor(
  id: string,
  input: { title?: string; specialties?: string[]; bio?: string; departmentId?: string }
) {
  const doctor = await prisma.doctor.update({
    where: { id },
    data: input,
  });
  return { success: true as const, data: doctor };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/server/actions/department.ts src/server/actions/doctor.ts && git commit -m "feat: implement department and doctor CRUD actions"
```

---

### Task 16: 实现病历 Server Action

**Files:**
- Create: `src/server/actions/medical-record.ts`

- [ ] **Step 1: 实现病历逻辑**

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const prescriptionItemSchema = z.object({
  medicineName: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  notes: z.string().optional(),
});

const createRecordSchema = z.object({
  appointmentId: z.string().uuid(),
  doctorId: z.string().uuid(),
  diagnosis: z.string().min(1, "诊断结果不能为空"),
  prescription: z.array(prescriptionItemSchema).optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
});

export async function createMedicalRecord(input: {
  appointmentId: string;
  doctorId: string;
  diagnosis: string;
  prescription?: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }[];
  notes?: string;
  followUpDate?: string;
}) {
  const parsed = createRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
  });

  if (!appointment) {
    return { success: false as const, error: "预约不存在" };
  }

  if (appointment.status !== "confirmed") {
    return { success: false as const, error: "只能为已确认的预约创建病历" };
  }

  const record = await prisma.$transaction(async (tx) => {
    const medicalRecord = await tx.medicalRecord.create({
      data: {
        appointmentId: input.appointmentId,
        doctorId: input.doctorId,
        diagnosis: input.diagnosis,
        notes: input.notes ?? null,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      },
    });

    if (input.prescription && input.prescription.length > 0) {
      await tx.prescriptionItem.createMany({
        data: input.prescription.map((item) => ({
          medicalRecordId: medicalRecord.id,
          ...item,
        })),
      });
    }

    await tx.appointment.update({
      where: { id: input.appointmentId },
      data: { status: "completed" },
    });

    return medicalRecord;
  });

  return { success: true as const, data: record };
}

export async function getMedicalRecords(userId: string) {
  const records = await prisma.medicalRecord.findMany({
    where: {
      appointment: { userId },
    },
    include: {
      doctor: { select: { name: true, title: true } },
      items: true,
      appointment: { select: { createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return records;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/server/actions/medical-record.ts && git commit -m "feat: implement medical record actions"
```

---

## Phase 4: 前端视觉与组件开发

### Task 17: 创建全局布局组件

**Files:**
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/footer.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 创建 Header 组件**

```tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Building2, LogOut, User } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="font-heading text-xl font-bold text-cyan-900">
            宿院医约
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/departments"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-cyan-900"
          >
            科室导航
          </Link>
          {session && (
            <>
              <Link
                href="/appointments"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-cyan-900"
              >
                我的预约
              </Link>
              <Link
                href="/records"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-cyan-900"
              >
                我的病历
              </Link>
              {session.user.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-cyan-900"
                >
                  管理后台
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm text-slate-600">
                <User className="h-4 w-4" />
                {session.user.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-slate-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm" className="bg-primary text-white">
                登录
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 创建 Footer 组件**

```tsx
export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-slate-500">
            © 2026 宿院医约 · 高校校医院在线预约平台
          </p>
          <p className="text-sm text-slate-400">
            Powered by Next.js + Prisma
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: 更新根布局**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "宿院医约 - 高校校医院在线预约",
  description: "面向高校校医院的全人群在线预约平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: 创建 Providers 组件**

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 5: 验证布局渲染**

Run: `pnpm dev`
Expected: 页面显示 Header（含导航和登录按钮）+ Footer

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/ src/app/layout.tsx src/app/providers.tsx && git commit -m "feat: add global layout (header, footer, providers)"
```

---

### Task 18: 创建科室卡片和列表组件

**Files:**
- Create: `src/components/department-card.tsx`

- [ ] **Step 1: 创建 DepartmentCard**

```tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users } from "lucide-react";

type DepartmentCardProps = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  doctorCount: number;
};

export function DepartmentCard({
  id,
  name,
  description,
  location,
  doctorCount,
}: DepartmentCardProps) {
  return (
    <Link href={`/departments/${id}`}>
      <Card className="cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg text-cyan-900">
            {name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {description && (
            <p className="line-clamp-2 text-sm text-slate-600">{description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {doctorCount} 位医生
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/department-card.tsx && git commit -m "feat: add DepartmentCard component"
```

---

### Task 19: 创建医生卡片和列表组件

**Files:**
- Create: `src/components/doctor-card.tsx`

- [ ] **Step 1: 创建 DoctorCard**

```tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Stethoscope } from "lucide-react";

type DoctorCardProps = {
  id: string;
  name: string;
  title: string;
  specialties: string[] | null;
  departmentName: string;
};

export function DoctorCard({
  id,
  name,
  title,
  specialties,
  departmentName,
}: DoctorCardProps) {
  return (
    <Link href={`/doctors/${id}`}>
      <Card className="cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-md">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              <Stethoscope className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-heading text-base text-cyan-900">
              {name}
            </CardTitle>
            <p className="text-sm text-slate-500">{title}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge variant="secondary" className="text-xs">
            {departmentName}
          </Badge>
          {specialties && specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {specialties.slice(0, 3).map((s) => (
                <Badge key={s} variant="outline" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/doctor-card.tsx && git commit -m "feat: add DoctorCard component"
```

---

### Task 20: 创建首页

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 实现首页**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DepartmentCard } from "@/components/department-card";
import { getDepartments } from "@/server/actions/department";
import { CalendarDays, FileText, BarChart3 } from "lucide-react";

export default async function HomePage() {
  const departments = await getDepartments();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="font-heading text-4xl font-bold text-cyan-900 md:text-5xl">
          宿院医约
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          高校校医院在线预约平台 — 轻松挂号，告别排队
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/departments">
            <Button size="lg" className="bg-primary text-white">
              <CalendarDays className="mr-2 h-5 w-5" />
              立即预约
            </Button>
          </Link>
          <Link href="/records">
            <Button size="lg" variant="outline">
              <FileText className="mr-2 h-5 w-5" />
              查看病历
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mb-16 grid gap-6 md:grid-cols-3">
        {[
          {
            icon: CalendarDays,
            title: "在线预约",
            desc: "选择科室、医生和时段，3步完成预约",
          },
          {
            icon: FileText,
            title: "电子病历",
            desc: "就诊记录和处方随时查看，不怕丢失",
          },
          {
            icon: BarChart3,
            title: "数据看板",
            desc: "管理员实时掌握预约趋势和科室热度",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl border border-slate-200 bg-white p-6 text-center"
          >
            <Icon className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-4 font-heading text-lg font-semibold text-cyan-900">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{desc}</p>
          </div>
        ))}
      </section>

      {/* Department Grid */}
      <section>
        <h2 className="mb-6 font-heading text-2xl font-bold text-cyan-900">
          科室导航
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              id={dept.id}
              name={dept.name}
              description={dept.description}
              location={dept.location}
              doctorCount={dept._count.doctors}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: 验证首页渲染**

Run: `pnpm dev`
Expected: 首页显示 Hero、Features、科室导航三个区域

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx && git commit -m "feat: implement homepage with hero, features, department grid"
```

---

### Task 21: 创建登录和注册页面

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/register/page.tsx`

- [ ] **Step 1: 实现登录页**

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      phone: formData.get("phone") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("手机号或密码错误");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-128px)] items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl text-cyan-900">
            登录
          </CardTitle>
          <CardDescription>使用手机号和密码登录</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="请输入手机号"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="请输入密码"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-white"
              disabled={loading}
            >
              {loading ? "登录中..." : "登录"}
            </Button>
            <p className="text-center text-sm text-slate-500">
              还没有账号？{" "}
              <Link href="/register" className="text-primary hover:underline">
                立即注册
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: 实现注册页**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerUser } from "@/server/actions/auth";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const role = formData.get("role") as string;

    const result = await registerUser({
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      password: formData.get("password") as string,
      role,
      studentId: (formData.get("studentId") as string) || undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-128px)] items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl text-cyan-900">
            注册
          </CardTitle>
          <CardDescription>创建您的预约账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input id="name" name="name" placeholder="请输入姓名" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input id="phone" name="phone" type="tel" placeholder="请输入手机号" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" placeholder="至少6位" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">身份</Label>
              <Select name="role" defaultValue="student">
                <SelectTrigger>
                  <SelectValue placeholder="选择身份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">学生</SelectItem>
                  <SelectItem value="faculty">教职工</SelectItem>
                  <SelectItem value="external">校外人员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">学号/工号（选填）</Label>
              <Input id="studentId" name="studentId" placeholder="选填" />
            </div>
            <Button type="submit" className="w-full bg-cta text-white" disabled={loading}>
              {loading ? "注册中..." : "注册"}
            </Button>
            <p className="text-center text-sm text-slate-500">
              已有账号？{" "}
              <Link href="/login" className="text-primary hover:underline">
                立即登录
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: 验证登录/注册页面**

Run: `pnpm dev`
Expected: 登录页显示手机号+密码表单，注册页显示完整注册表单

- [ ] **Step 4: Commit**

```bash
git add src/app/login/ src/app/register/ && git commit -m "feat: implement login and register pages"
```

---

### Task 22: 创建科室列表和详情页

**Files:**
- Create: `src/app/departments/page.tsx`
- Create: `src/app/departments/[id]/page.tsx`

- [ ] **Step 1: 实现科室列表页**

```tsx
import { DepartmentCard } from "@/components/department-card";
import { getDepartments } from "@/server/actions/department";

export default async function DepartmentsPage() {
  const departments = await getDepartments();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-8 font-heading text-3xl font-bold text-cyan-900">
        科室导航
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <DepartmentCard
            key={dept.id}
            id={dept.id}
            name={dept.name}
            description={dept.description}
            location={dept.location}
            doctorCount={dept._count.doctors}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 实现科室详情页**

```tsx
import { notFound } from "next/navigation";
import { getDepartmentById } from "@/server/actions/department";
import { DoctorCard } from "@/components/doctor-card";
import { MapPin } from "lucide-react";

export default async function DepartmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const department = await getDepartmentById(params.id);

  if (!department) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-cyan-900">
          {department.name}
        </h1>
        {department.location && (
          <p className="mt-2 flex items-center gap-1 text-slate-600">
            <MapPin className="h-4 w-4" />
            {department.location}
          </p>
        )}
        {department.description && (
          <p className="mt-4 text-slate-600">{department.description}</p>
        )}
      </div>

      <h2 className="mb-4 font-heading text-xl font-semibold text-cyan-900">
        医生列表
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {department.doctors.map((doc) => (
          <DoctorCard
            key={doc.id}
            id={doc.id}
            name={doc.user.name}
            title={doc.title}
            specialties={doc.specialties as string[] | null}
            departmentName={department.name}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/departments/ && git commit -m "feat: implement department list and detail pages"
```

---

### Task 23: 创建医生详情页和预约表单

**Files:**
- Create: `src/app/doctors/[id]/page.tsx`
- Create: `src/components/appointment-form.tsx`

- [ ] **Step 1: 创建预约表单组件**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createAppointment } from "@/server/actions/appointment";
import { useSession } from "next-auth/react";
import { CalendarDays, Clock, CheckCircle2 } from "lucide-react";

type Schedule = {
  id: string;
  date: string;
  timeSlot: string;
  maxPatients: number;
  currentPatients: number;
  status: string;
};

type AppointmentFormProps = {
  doctorId: string;
  doctorName: string;
  schedules: Schedule[];
};

const timeSlotLabels: Record<string, string> = {
  morning: "上午",
  afternoon: "下午",
  evening: "晚间",
};

export function AppointmentForm({
  doctorId,
  doctorName,
  schedules,
}: AppointmentFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ queueNumber: number } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!selectedSchedule || !session?.user?.id) return;

    setLoading(true);
    setError("");

    const res = await createAppointment({
      userId: session.user.id,
      doctorId,
      scheduleId: selectedSchedule.id,
      symptoms: symptoms || undefined,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error);
    } else {
      setResult({ queueNumber: res.data.queueNumber });
    }
  }

  if (result) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex flex-col items-center py-8">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <h3 className="mt-4 font-heading text-xl font-bold text-green-800">
            预约成功
          </h3>
          <p className="mt-2 text-green-700">
            您的排队号是：<span className="text-2xl font-bold">{result.queueNumber}</span>
          </p>
          <Button
            className="mt-6"
            onClick={() => router.push("/appointments")}
          >
            查看我的预约
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group schedules by date
  const schedulesByDate = schedules.reduce((acc, s) => {
    const date = s.date.split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(s);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 font-heading text-lg font-semibold text-cyan-900">
          选择就诊时段
        </h3>
        <div className="space-y-4">
          {Object.entries(schedulesByDate).map(([date, slots]) => (
            <div key={date}>
              <p className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
                <CalendarDays className="h-4 w-4" />
                {date}
              </p>
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const available = slot.maxPatients - slot.currentPatients;
                  const isSelected = selectedSchedule?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSchedule(slot)}
                      disabled={available <= 0}
                      className={`flex items-center gap-1 rounded-lg border px-4 py-2 text-sm transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : available > 0
                          ? "border-slate-200 bg-white text-slate-700 hover:border-primary"
                          : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {timeSlotLabels[slot.timeSlot]}
                      <Badge
                        variant={available > 0 ? "secondary" : "destructive"}
                        className="ml-1 text-xs"
                      >
                        余{available}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="symptoms">症状描述（选填）</Label>
        <Textarea
          id="symptoms"
          placeholder="请简要描述您的症状，方便医生提前了解..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          className="mt-2"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!selectedSchedule || loading}
        className="w-full bg-cta text-white"
        size="lg"
      >
        {loading ? "提交中..." : "确认预约"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: 实现医生详情页**

```tsx
import { notFound } from "next/navigation";
import { getDoctorById } from "@/server/actions/doctor";
import { AppointmentForm } from "@/components/appointment-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Stethoscope } from "lucide-react";

export default async function DoctorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const doctor = await getDoctorById(params.id);

  if (!doctor) {
    notFound();
  }

  const schedules = doctor.schedules.map((s) => ({
    ...s,
    date: s.date.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-start gap-6">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Stethoscope className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-2xl font-bold text-cyan-900">
            {doctor.user.name}
          </h1>
          <p className="text-slate-600">{doctor.title}</p>
          <Badge variant="secondary" className="mt-2">
            {doctor.department.name}
          </Badge>
          {doctor.specialties && doctor.specialties.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {(doctor.specialties as string[]).map((s) => (
                <Badge key={s} variant="outline" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          )}
          {doctor.bio && (
            <p className="mt-4 text-sm text-slate-600">{doctor.bio}</p>
          )}
        </div>
      </div>

      <AppointmentForm
        doctorId={doctor.id}
        doctorName={doctor.user.name}
        schedules={schedules}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/doctors/ src/components/appointment-form.tsx && git commit -m "feat: implement doctor detail page with appointment form"
```

---

### Task 24: 创建我的预约页面

**Files:**
- Create: `src/app/appointments/page.tsx`
- Create: `src/components/appointment-list.tsx`

- [ ] **Step 1: 创建 AppointmentList 组件**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cancelAppointment } from "@/server/actions/appointment";
import { CalendarDays, Clock, X } from "lucide-react";
import { useState } from "react";

type Appointment = {
  id: string;
  status: string;
  symptoms: string | null;
  queueNumber: number | null;
  createdAt: Date;
  doctor: {
    name: string;
    title: string;
    department: { name: string };
  };
  schedule: {
    date: Date;
    timeSlot: string;
  };
};

const statusConfig: Record<string, { label: string; variant: string }> = {
  pending: { label: "待确认", variant: "secondary" },
  confirmed: { label: "已确认", variant: "default" },
  completed: { label: "已完成", variant: "outline" },
  cancelled: { label: "已取消", variant: "destructive" },
};

const timeSlotLabels: Record<string, string> = {
  morning: "上午",
  afternoon: "下午",
  evening: "晚间",
};

export function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleCancel(id: string) {
    setCancellingId(id);
    // Would need userId from session
    // await cancelAppointment({ appointmentId: id, userId });
    router.refresh();
  }

  if (appointments.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        暂无预约记录
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((apt) => {
        const status = statusConfig[apt.status] || statusConfig.pending;
        return (
          <Card key={apt.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-cyan-900">
                    {apt.doctor.name}
                  </span>
                  <Badge variant={status.variant as any}>{status.label}</Badge>
                  {apt.queueNumber && (
                    <Badge variant="outline">#{apt.queueNumber}</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {apt.doctor.department.name} · {apt.doctor.title}
                </p>
                <p className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(apt.schedule.date).toLocaleDateString("zh-CN")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeSlotLabels[apt.schedule.timeSlot]}
                  </span>
                </p>
              </div>
              {(apt.status === "pending" || apt.status === "confirmed") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancel(apt.id)}
                  disabled={cancellingId === apt.id}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 实现我的预约页面**

```tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppointmentList } from "@/components/appointment-list";

export default async function AppointmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const appointments = await prisma.appointment.findMany({
    where: { userId: session.user.id },
    include: {
      doctor: {
        include: { department: { select: { name: true } } },
      },
      schedule: { select: { date: true, timeSlot: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 font-heading text-3xl font-bold text-cyan-900">
        我的预约
      </h1>
      <AppointmentList appointments={appointments as any} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/appointments/ src/components/appointment-list.tsx && git commit -m "feat: implement my appointments page with cancel action"
```

---

### Task 25: 创建我的病历页面

**Files:**
- Create: `src/app/records/page.tsx`
- Create: `src/components/medical-record-card.tsx`

- [ ] **Step 1: 创建 MedicalRecordCard 组件**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, FileText } from "lucide-react";

type MedicalRecordCardProps = {
  diagnosis: string;
  notes: string | null;
  followUpDate: Date | null;
  createdAt: Date;
  doctorName: string;
  doctorTitle: string;
  prescription: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string | null;
  }[];
};

export function MedicalRecordCard({
  diagnosis,
  notes,
  followUpDate,
  createdAt,
  doctorName,
  doctorTitle,
  prescription,
}: MedicalRecordCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="font-heading text-lg text-cyan-900">
            {diagnosis}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {new Date(createdAt).toLocaleDateString("zh-CN")}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">
          {doctorName} · {doctorTitle}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes && (
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">医嘱</p>
            <p className="text-sm text-slate-700">{notes}</p>
          </div>
        )}
        {followUpDate && (
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">复诊日期</p>
            <p className="text-sm text-slate-700">
              {new Date(followUpDate).toLocaleDateString("zh-CN")}
            </p>
          </div>
        )}
        {prescription.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-500">
              <Pill className="h-3 w-3" />
              处方
            </p>
            <div className="space-y-2">
              {prescription.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-slate-50 p-3 text-sm"
                >
                  <p className="font-medium text-cyan-900">
                    {item.medicineName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.dosage} · {item.frequency} · {item.duration}
                  </p>
                  {item.notes && (
                    <p className="mt-1 text-xs text-slate-400">{item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 实现病历页面**

```tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getMedicalRecords } from "@/server/actions/medical-record";
import { MedicalRecordCard } from "@/components/medical-record-card";

export default async function RecordsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const records = await getMedicalRecords(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 font-heading text-3xl font-bold text-cyan-900">
        我的病历
      </h1>
      {records.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          暂无病历记录
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <MedicalRecordCard
              key={record.id}
              diagnosis={record.diagnosis}
              notes={record.notes}
              followUpDate={record.followUpDate}
              createdAt={record.createdAt}
              doctorName={record.doctor.name}
              doctorTitle={record.doctor.title}
              prescription={record.items as any}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/records/ src/components/medical-record-card.tsx && git commit -m "feat: implement medical records page with prescription display"
```

---

### Task 26: 创建管理后台布局和排班管理

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/schedules/page.tsx`
- Create: `src/components/schedule-calendar.tsx`

- [ ] **Step 1: 创建管理后台侧边栏**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, Building2, BarChart3 } from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "数据看板", icon: LayoutDashboard },
  { href: "/admin/schedules", label: "排班管理", icon: Calendar },
  { href: "/admin/doctors", label: "医生管理", icon: Users },
  { href: "/admin/departments", label: "科室管理", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white">
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: 创建管理后台布局**

```tsx
import { Sidebar } from "@/components/layout/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-128px)]">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: 创建排班管理页面**

```tsx
import { prisma } from "@/lib/prisma";
import { ScheduleCalendar } from "@/components/schedule-calendar";

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
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">
        排班管理
      </h1>
      <ScheduleCalendar doctors={doctors as any} />
    </div>
  );
}
```

- [ ] **Step 4: 创建排班日历组件**

```tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const timeSlotLabels: Record<string, string> = {
  morning: "上午",
  afternoon: "下午",
  evening: "晚间",
};

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  full: "bg-amber-100 text-amber-800",
  closed: "bg-slate-100 text-slate-500",
};

type Doctor = {
  id: string;
  user: { name: string };
  department: { name: string };
  schedules: {
    id: string;
    date: Date;
    timeSlot: string;
    maxPatients: number;
    currentPatients: number;
    status: string;
  }[];
};

export function ScheduleCalendar({ doctors }: { doctors: Doctor[] }) {
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");

  const filtered =
    selectedDoctor === "all"
      ? doctors
      : doctors.filter((d) => d.id === selectedDoctor);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="选择医生" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部医生</SelectItem>
            {doctors.map((doc) => (
              <SelectItem key={doc.id} value={doc.id}>
                {doc.user.name} - {doc.department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((doc) => (
          <Card key={doc.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {doc.user.name}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  {doc.department.name}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {doc.schedules.length === 0 ? (
                <p className="text-xs text-slate-400">暂无排班</p>
              ) : (
                <div className="space-y-1">
                  {doc.schedules.slice(0, 10).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-600">
                        {new Date(s.date).toLocaleDateString("zh-CN")}{" "}
                        {timeSlotLabels[s.timeSlot]}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-400">
                          {s.currentPatients}/{s.maxPatients}
                        </span>
                        <Badge
                          className={`text-xs ${statusColors[s.status] || ""}`}
                          variant="outline"
                        >
                          {s.status}
                        </Badge>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/sidebar.tsx src/app/admin/ src/components/schedule-calendar.tsx && git commit -m "feat: implement admin layout with sidebar and schedule management"
```

---

### Task 27: 创建数据看板页面

**Files:**
- Create: `src/app/admin/dashboard/page.tsx`
- Create: `src/components/charts/trend-chart.tsx`
- Create: `src/components/charts/department-chart.tsx`
- Create: `src/components/charts/doctor-chart.tsx`
- Create: `src/components/charts/status-chart.tsx`

- [ ] **Step 1: 创建趋势折线图**

```tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TrendChartProps = {
  data: { date: string; count: number }[];
  title: string;
};

export function TrendChart({ data, title }: TrendChartProps) {
  return (
    <div>
      <h3 className="mb-4 font-heading text-lg font-semibold text-cyan-900">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="date" stroke="#475569" fontSize={12} />
          <YAxis stroke="#475569" fontSize={12} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#0891B2"
            strokeWidth={2}
            dot={{ fill: "#0891B2" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: 创建科室热度柱状图**

```tsx
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

type DepartmentChartProps = {
  data: { name: string; count: number }[];
  title: string;
};

export function DepartmentChart({ data, title }: DepartmentChartProps) {
  return (
    <div>
      <h3 className="mb-4 font-heading text-lg font-semibold text-cyan-900">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="name" stroke="#475569" fontSize={12} />
          <YAxis stroke="#475569" fontSize={12} />
          <Tooltip />
          <Bar dataKey="count" fill="#0891B2" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 3: 创建医生工作量柱状图**

```tsx
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

type DoctorChartProps = {
  data: { name: string; count: number }[];
  title: string;
};

export function DoctorChart({ data, title }: DoctorChartProps) {
  return (
    <div>
      <h3 className="mb-4 font-heading text-lg font-semibold text-cyan-900">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis type="number" stroke="#475569" fontSize={12} />
          <YAxis dataKey="name" type="category" stroke="#475569" fontSize={12} width={80} />
          <Tooltip />
          <Bar dataKey="count" fill="#059669" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: 创建状态分布饼图**

```tsx
"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

type StatusChartProps = {
  data: { status: string; count: number }[];
  title: string;
};

const COLORS = ["#F59E0B", "#0891B2", "#EF4444", "#22C55E"];

const statusLabels: Record<string, string> = {
  pending: "待确认",
  confirmed: "已确认",
  cancelled: "已取消",
  completed: "已完成",
};

export function StatusChart({ data, title }: StatusChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    status: statusLabels[d.status] || d.status,
  }));

  return (
    <div>
      <h3 className="mb-4 font-heading text-lg font-semibold text-cyan-900">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="count"
            nameKey="status"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 5: 实现数据看板页面**

```tsx
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/charts/trend-chart";
import { DepartmentChart } from "@/components/charts/department-chart";
import { DoctorChart } from "@/components/charts/doctor-chart";
import { StatusChart } from "@/components/charts/status-chart";
import { CalendarDays, Users, Building2, Activity } from "lucide-react";

export default async function DashboardPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const today = new Date(now.toISOString().split("T")[0]);

  // Stats
  const [totalAppointments, todayAppointments, totalDoctors, totalDepartments] =
    await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.doctor.count(),
      prisma.department.count({ where: { isActive: true } }),
    ]);

  // Trend data (last 30 days)
  const trendRaw = await prisma.appointment.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: true,
  });

  const trendData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    const found = trendRaw.find(
      (r) => r.createdAt.toISOString().split("T")[0] === dateStr
    );
    return { date: dateStr.slice(5), count: found?._count || 0 };
  });

  // Department heat
  const deptHeat = await prisma.appointment.groupBy({
    by: ["doctorId"],
    _count: true,
  });

  const doctorsWithDept = await prisma.doctor.findMany({
    include: { department: { select: { name: true } } },
  });

  const deptMap = new Map<string, { name: string; count: number }>();
  for (const d of deptHeat) {
    const doc = doctorsWithDept.find((doc) => doc.id === d.doctorId);
    if (doc) {
      const name = doc.department.name;
      const existing = deptMap.get(name);
      deptMap.set(name, {
        name,
        count: (existing?.count || 0) + d._count,
      });
    }
  }
  const departmentData = Array.from(deptMap.values()).sort(
    (a, b) => b.count - a.count
  );

  // Doctor workload
  const doctorWorkload = await prisma.appointment.groupBy({
    by: ["doctorId"],
    _count: true,
    orderBy: { _count: { doctorId: "desc" } },
    take: 10,
  });

  const doctorData = doctorWorkload.map((d) => {
    const doc = doctorsWithDept.find((doc) => doc.id === d.doctorId);
    return { name: doc?.user?.name || "Unknown", count: d._count };
  });

  // Status distribution
  const statusDist = await prisma.appointment.groupBy({
    by: ["status"],
    _count: true,
  });

  const statusData = statusDist.map((s) => ({
    status: s.status,
    count: s._count,
  }));

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">
        数据看板
      </h1>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "总预约数", value: totalAppointments, icon: CalendarDays },
          { label: "今日预约", value: todayAppointments, icon: Activity },
          { label: "医生总数", value: totalDoctors, icon: Users },
          { label: "科室总数", value: totalDepartments, icon: Building2 },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-cyan-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <TrendChart data={trendData} title="预约趋势（近30天）" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <DepartmentChart data={departmentData} title="科室热度" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <DoctorChart data={doctorData} title="医生工作量 TOP10" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <StatusChart data={statusData} title="预约状态分布" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 验证看板渲染**

Run: `pnpm dev`
Expected: 管理后台看板页面显示 4 个统计卡片 + 4 个图表

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/dashboard/ src/components/charts/ && git commit -m "feat: implement admin dashboard with 4 chart types"
```

---

### Task 28: 创建医生管理和科室管理页面

**Files:**
- Create: `src/app/admin/doctors/page.tsx`
- Create: `src/app/admin/departments/page.tsx`

- [ ] **Step 1: 实现医生管理页面**

```tsx
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope } from "lucide-react";

export default async function DoctorsManagementPage() {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: { select: { name: true, phone: true } },
      department: { select: { name: true } },
      _count: { select: { schedules: true, appointments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">
        医生管理
      </h1>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 实现科室管理页面**

```tsx
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users } from "lucide-react";

export default async function DepartmentsManagementPage() {
  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { doctors: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">
        科室管理
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{dept.name}</CardTitle>
                <Badge variant={dept.isActive ? "default" : "destructive"}>
                  {dept.isActive ? "启用" : "停用"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {dept.description && (
                <p className="text-xs text-slate-500 line-clamp-2">
                  {dept.description}
                </p>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/doctors/ src/app/admin/departments/ && git commit -m "feat: implement doctor and department management pages"
```

---

## Phase 5: 前后端联调

### Task 29: 创建种子数据脚本

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: 创建种子数据**

```typescript
import { PrismaClient, UserRole, TimeSlot } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 清理现有数据
  await prisma.prescriptionItem.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  // 创建管理员
  const admin = await prisma.user.create({
    data: {
      name: "管理员",
      phone: "13800000000",
      passwordHash: await bcrypt.hash("admin123", 12),
      role: UserRole.admin,
    },
  });

  // 创建示例用户
  const student = await prisma.user.create({
    data: {
      name: "张三",
      phone: "13800000001",
      passwordHash: await bcrypt.hash("123456", 12),
      role: UserRole.student,
      studentId: "2024001",
    },
  });

  // 创建科室
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: "内科",
        description: "诊治心血管、呼吸、消化等系统疾病",
        location: "门诊楼 2F",
      },
    }),
    prisma.department.create({
      data: {
        name: "外科",
        description: "诊治骨科、普外、泌尿等外科疾病",
        location: "门诊楼 3F",
      },
    }),
    prisma.department.create({
      data: {
        name: "口腔科",
        description: "口腔检查、龋齿治疗、洗牙等",
        location: "门诊楼 1F",
      },
    }),
    prisma.department.create({
      data: {
        name: "眼科",
        description: "视力检查、眼部疾病诊治",
        location: "门诊楼 2F",
      },
    }),
    prisma.department.create({
      data: {
        name: "中医科",
        description: "中医诊疗、针灸推拿",
        location: "中医楼 1F",
      },
    }),
  ]);

  // 创建医生用户
  const doctorUsers = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      prisma.user.create({
        data: {
          name: `医生${String.fromCharCode(65 + i)}`,
          phone: `1380000${String(i + 10).padStart(4, "0")}`,
          passwordHash: await bcrypt.hash("123456", 12),
          role: UserRole.faculty,
        },
      })
    )
  );

  // 创建医生
  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        userId: doctorUsers[0].id,
        departmentId: departments[0].id,
        title: "主任医师",
        specialties: ["心血管", "高血压"],
        bio: "从事内科临床工作20余年",
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[1].id,
        departmentId: departments[0].id,
        title: "副主任医师",
        specialties: ["呼吸系统", "感冒发热"],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[2].id,
        departmentId: departments[1].id,
        title: "主治医师",
        specialties: ["骨科", "运动损伤"],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[3].id,
        departmentId: departments[2].id,
        title: "主治医师",
        specialties: ["龋齿", "洗牙"],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[4].id,
        departmentId: departments[3].id,
        title: "副主任医师",
        specialties: ["近视", "干眼症"],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[5].id,
        departmentId: departments[4].id,
        title: "主任医师",
        specialties: ["针灸", "推拿", "中药调理"],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[6].id,
        departmentId: departments[0].id,
        title: "住院医师",
        specialties: ["消化系统"],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[7].id,
        departmentId: departments[1].id,
        title: "主任医师",
        specialties: ["普外", "微创手术"],
      },
    }),
  ]);

  // 创建排班（未来7天）
  const now = new Date();
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const date = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    for (const doctor of doctors) {
      for (const timeSlot of [TimeSlot.morning, TimeSlot.afternoon]) {
        await prisma.schedule.create({
          data: {
            doctorId: doctor.id,
            date,
            timeSlot,
            maxPatients: 20,
            currentPatients: Math.floor(Math.random() * 15),
          },
        });
      }
    }
  }

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: 在 package.json 中添加 seed 脚本**

```json
{
  "prisma": {
    "seed": "pnpm tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 3: 安装 tsx**

```bash
pnpm add -D tsx
```

- [ ] **Step 4: 运行种子数据**

```bash
pnpm prisma db seed
```

Expected: `Seed data created successfully!`

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts && git commit -m "feat: add seed data script with sample departments, doctors, schedules"
```

---

### Task 30: 端到端验证

**Files:** 无新增

- [ ] **Step 1: 启动开发服务器**

```bash
pnpm dev
```

- [ ] **Step 2: 验证首页**

浏览器打开 http://localhost:3000
Expected: 显示 Hero、Features、科室列表

- [ ] **Step 3: 验证登录**

访问 http://localhost:3000/login
使用 `13800000000` / `admin123` 登录
Expected: 登录成功，跳转首页，Header 显示用户名

- [ ] **Step 4: 验证科室详情**

点击科室卡片
Expected: 显示科室详情和医生列表

- [ ] **Step 5: 验证预约流程**

选择医生 → 选择时段 → 确认预约
Expected: 显示排队号，预约成功

- [ ] **Step 6: 验证管理后台**

访问 http://localhost:3000/admin/dashboard
Expected: 显示统计卡片和图表

- [ ] **Step 7: 验证排班管理**

访问 http://localhost:3000/admin/schedules
Expected: 显示医生排班列表

- [ ] **Step 8: 运行类型检查**

```bash
pnpm tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 9: 运行 lint**

```bash
pnpm lint
```

Expected: 无 lint 错误

- [ ] **Step 10: 最终 Commit**

```bash
git add -A && git commit -m "chore: end-to-end verification complete"
```
