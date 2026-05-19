# 医生系统迭代设计 Spec

**日期：** 2026-05-18
**状态：** 已批准
**架构方案：** 渐进式扩展（方案 A）

---

## 1. 概述

在现有 SuColMed 校园医疗管理系统上迭代新功能，补齐管理员后台 CRUD、新增医生工作台、增强患者端，并增加药品管理、数据报表、排队叫号等子系统。

### 1.1 功能范围

| 模块 | 说明 | 优先级 |
|------|------|--------|
| Admin CRUD 补齐 | 科室/医生/排班的增删改表单 | P0 |
| 医生工作台 | 今日排班、预约管理、病历书写、叫号 | P0 |
| 患者端增强 | 三步预约向导、病历查看、评价医生 | P0 |
| 药品管理 | 药品 CRUD、库存预警、处方关联 | P1 |
| 数据报表 | 仪表盘统计、医生工作量、科室报表 | P1 |
| 排队叫号 | 号码生成、叫号面板、SSE 实时推送 | P1 |

### 1.2 角色体系

| 角色 | 说明 | 主要页面 |
|------|------|----------|
| admin | 系统管理员 | /admin/* |
| doctor | 医生 | /doctor/* |
| patient | 患者（含 student/faculty/external） | /patient/* |

---

## 2. 数据库 Schema 变更

### 2.1 新增模型

```prisma
// 患者评价
model Review {
  id            String   @id @default(uuid())
  appointmentId String   @unique
  patientId     String
  doctorId      String
  rating        Int      // 1-5 星
  comment       String?
  createdAt     DateTime @default(now())

  appointment Appointment @relation(fields: [appointmentId], references: [id])
  patient     User        @relation(fields: [patientId], references: [id])
  doctor      Doctor      @relation(fields: [doctorId], references: [id])

  @@map("reviews")
}

// 药品
model Medicine {
  id          String   @id @default(uuid())
  name        String
  category    String   // 分类：抗生素、解热镇痛等
  spec        String   // 规格：0.25g*12片
  unit        String   // 单位：片、盒、瓶
  stock       Int      @default(0)
  price       Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  items PrescriptionItem[]

  @@map("medicines")
}

// 排队号码
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

### 2.2 修改现有模型

```prisma
// User 新增关联
model User {
  // ... existing fields ...
  appointments Appointment[]
  doctor       Doctor?
  reviews      Review[]        // 新增
}

// Doctor 新增关联
model Doctor {
  // ... existing fields ...
  schedules    Schedule[]
  appointments Appointment[]
  medicalRecords MedicalRecord[]
  reviews      Review[]        // 新增
}

// Schedule 新增关联
model Schedule {
  // ... existing fields ...
  doctor      Doctor        @relation(...)
  appointments Appointment[]
  queueNumbers QueueNumber[]  // 新增
}

// PrescriptionItem 新增外键
model PrescriptionItem {
  // ... existing fields ...
  medicineId   String?     // 新增
  medicine     Medicine?   @relation(fields: [medicineId], references: [id])
}
```

---

## 3. Server Actions & API 设计

### 3.1 新增 Server Actions

```typescript
// src/server/actions/review.ts
createReview(appointmentId: string, rating: number, comment?: string)
getDoctorReviews(doctorId: string)  // 含平均分统计

// src/server/actions/medicine.ts
getMedicines(category?: string, search?: string)
createMedicine(input: MedicineInput)
updateMedicine(id: string, input: Partial<MedicineInput>)
deleteMedicine(id: string)
reduceStock(medicineId: string, quantity: number)

// src/server/actions/queue.ts
createQueueNumber(scheduleId: string)
callNextNumber(scheduleId: string)
getQueueStatus(scheduleId: string)

// src/server/actions/admin.ts (增强)
deleteDoctor(id: string)
deleteSchedule(id: string)
deleteDepartment(id: string)
```

### 3.2 新增 API Routes

```
GET  /api/queue/[scheduleId]       → 排队状态（SSE）
POST /api/queue/[scheduleId]/call  → 医生叫号
```

使用 Server-Sent Events 实现排队状态实时推送。

---

## 4. 前端页面结构

### 4.1 路由规划

```
/admin/
  /dashboard            → 仪表盘（增强：统计卡片）
  /departments          → 科室管理（增强：CRUD 表单）
  /doctors              → 医生管理（增强：CRUD 表单）
  /schedules            → 排班管理（增强：创建/编辑）
  /medicines            → 药品管理（新增）
  /reviews              → 评价管理（新增）

/doctor/
  /dashboard            → 今日排班概览（新增）
  /appointments         → 预约管理（新增）
  /queue                → 排队叫号面板（新增）
  /records              → 病历书写（新增）

/patient/
  /appointments         → 我的预约（增强）
  /new-appointment      → 新建预约向导（新增）
  /records              → 我的病历（新增）
  /reviews              → 我的评价（新增）
```

### 4.2 关键页面交互

| 页面 | 核心交互 |
|------|----------|
| Admin 科室管理 | 卡片列表 + Sheet 侧滑表单 + 启用/停用切换 |
| Admin 医生管理 | 卡片列表 + 创建表单（选用户→填信息） |
| Admin 排班管理 | 日历视图 + 批量创建 + 状态切换 |
| Admin 药品管理 | 表格列表 + 增删改 + 库存预警 |
| Doctor 今日面板 | 今日排班卡片 + 当前排队号码 + 待处理预约数 |
| Doctor 排队叫号 | 大字号当前号码 + "叫下一位"按钮 + 队列列表 |
| Patient 新建预约 | 三步向导：选科室→选医生→选时间确认 |
| Patient 评价 | 预约完成后弹出评分+评论表单 |

---

## 5. UI/UX 规范

### 5.1 视觉规范

| 元素 | 规范 |
|------|------|
| 主色 | `hsl(187 84% 43%)` (cyan-600) |
| 卡片 | `bg-white` 圆角 `rounded-lg` 阴影 `shadow-sm` |
| 标题 | `font-heading` (Figtree) + `text-cyan-900` |
| 表单 | shadcn Input/Select/Textarea + Zod 校验 |
| 状态徽章 | Badge 组件，绿=开放/琥珀=已满/灰=关闭 |
| 操作按钮 | Primary=创建，Secondary=编辑，Destructive=删除 |

### 5.2 交互模式

| 场景 | 交互方式 |
|------|----------|
| 创建/编辑 | Sheet 侧滑表单（移动端友好） |
| 删除确认 | AlertDialog 二次确认 |
| 表单校验 | 实时校验 + 提交时 Zod 验证 + 错误提示 |
| 空状态 | 插图 + 引导文案 + CTA 按钮 |
| 加载状态 | Skeleton 骨架屏 |
| 排队叫号 | 大字号当前号码 + 脉冲动画提示 |

### 5.3 响应式断点

- `sm` (640px)：单列布局
- `md` (768px)：双列
- `lg` (1024px)：三列 + 侧边栏

---

## 6. E2E 测试场景清单

### 6.1 Admin 管理员测试

| # | 场景 | 步骤 | 预期结果 |
|---|------|------|----------|
| A1 | 创建科室 | 填写名称/描述/位置 → 提交 | 列表中出现新科室 |
| A2 | 编辑科室 | 点击编辑 → 修改名称 → 保存 | 名称更新成功 |
| A3 | 停用科室 | 点击启用/停用切换 | 状态变更，Badge 颜色变化 |
| A4 | 创建医生 | 选择用户 → 填写职称/科室 → 提交 | 医生出现在列表 |
| A5 | 创建排班 | 选择医生 → 选日期/时段 → 设置人数 | 排班出现在日历 |
| A6 | 批量创建排班 | 选择周几循环 → 自动创建多条 | 日历显示批量排班 |
| A7 | 药品增删改 | 创建/编辑/删除药品 | 列表正确更新 |
| A8 | 库存预警 | 药品库存低于阈值 | 显示红色预警标识 |

### 6.2 Doctor 医生测试

| # | 场景 | 步骤 | 预期结果 |
|---|------|------|----------|
| D1 | 查看今日排班 | 登录医生账号 → 进入仪表盘 | 显示今日排班和预约数 |
| D2 | 接诊患者 | 查看预约列表 → 点击接诊 | 状态变为"就诊中" |
| D3 | 写病历 | 填写诊断/处方 → 保存 | 病历创建成功 |
| D4 | 叫号 | 点击"叫下一位" | 号码更新，队列状态变化 |
| D5 | 完成就诊 | 结束诊疗 → 标记完成 | 预约状态变为"已完成" |

### 6.3 Patient 患者测试

| # | 场景 | 步骤 | 预期结果 |
|---|------|------|----------|
| P1 | 浏览科室 | 进入科室列表 → 查看详情 | 显示科室信息和医生列表 |
| P2 | 预约挂号 | 选科室 → 选医生 → 选时间 → 确认 | 预约创建成功 |
| P3 | 查看预约 | 进入"我的预约" | 显示预约列表和状态 |
| P4 | 取消预约 | 点击取消 → 确认 | 状态变为"已取消" |
| P5 | 评价医生 | 就诊完成后 → 点击评价 → 打分+评论 | 评价提交成功 |
| P6 | 查看病历 | 进入"我的病历" | 显示诊断和处方详情 |
| P7 | 排队状态 | 就诊当天查看排队进度 | 显示当前排队号码和等待人数 |

### 6.4 跨角色集成测试

| # | 场景 | 步骤 | 预期结果 |
|---|------|------|----------|
| I1 | 完整预约流程 | 患者预约 → 医生接诊 → 写病历 → 患者评价 | 全流程数据一致 |
| I2 | 排队叫号流程 | 患者签到 → 医生叫号 → 患者就诊 | 队列状态正确流转 |
| I3 | 药品扣减 | 医生开处方 → 药品库存减少 | 库存数量正确扣减 |

---

## 7. 实现分批计划

### Phase 1：Admin CRUD 补齐（核心基础）
- 科室管理：增删改表单 + 启用/停用
- 医生管理：创建/编辑/删除 + 关联用户
- 排班管理：创建/编辑/删除 + 批量创建

### Phase 2：医生工作台
- 今日排班面板
- 预约管理（接诊/完成）
- 病历书写 + 处方开药
- 排队叫号面板

### Phase 3：患者端增强
- 三步预约向导
- 我的病历查看
- 评价医生功能

### Phase 4：药品管理
- 药品 CRUD
- 库存管理 + 预警
- 处方关联药品

### Phase 5：数据报表
- 仪表盘统计卡片
- 医生工作量报表
- 科室预约统计

### Phase 6：排队叫号系统
- 排队号码生成
- 叫号 API + SSE 实时推送
- 医生端叫号面板

每个 Phase 完成后可独立使用，不依赖后续 Phase。

---

## 8. 技术约束

- **框架：** Next.js 16 App Router + React 19
- **ORM：** Prisma 7 + PostgreSQL
- **UI：** shadcn/ui + Tailwind CSS v4
- **校验：** Zod
- **认证：** NextAuth 5 (beta)
- **实时：** Server-Sent Events（排队叫号）
- **测试：** Playwright (E2E) + Vitest (单元)
