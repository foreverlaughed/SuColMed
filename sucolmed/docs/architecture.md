# 系统架构文档

## 架构概览

SuColMed 采用 Next.js 全栈架构，前端和后端在同一项目中，通过 Server Actions 和 Route Handlers 实现数据交互。

```
┌─────────────────────────────────────────────────────────┐
│                    客户端 (Browser)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Next.js App Router (SSR/CSR)                   │   │
│  │  ├── React Components                           │   │
│  │  ├── shadcn/ui + Tailwind CSS                   │   │
│  │  └── Recharts (Charts)                          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                    Server Actions / API Routes
                           │
┌─────────────────────────────────────────────────────────┐
│                    服务端 (Node.js)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Next.js Server                                 │   │
│  │  ├── Server Actions (业务逻辑)                   │   │
│  │  ├── NextAuth.js (认证)                         │   │
│  │  └── Prisma Client (ORM)                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                    Prisma ORM
                           │
┌─────────────────────────────────────────────────────────┐
│                    数据库 (PostgreSQL)                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Tables: users, departments, doctors,           │   │
│  │  schedules, appointments, medical_records,      │   │
│  │  prescription_items                             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 数据模型

### 实体关系图 (ERD)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │────<│  Appointment  │>────│   Schedule    │
│  (用户)      │     │   (预约)      │     │   (排班)      │
└──────┬──────┘     └──────┬───────┘     └──────┬───────┘
       │                   │                     │
       │                   │                     │
       │            ┌──────┴───────┐     ┌──────┴───────┐
       │            │ MedicalRecord │     │    Doctor     │
       │            │  (电子病历)    │     │   (医生)      │
       │            └──────┬───────┘     └──────┬───────┘
       │                   │                     │
       │            ┌──────┴───────┐     ┌──────┴───────┐
       │            │PrescriptionItem│    │  Department   │
       │            │  (处方明细)    │     │   (科室)      │
       │            └──────────────┘     └──────────────┘
       │
  ┌────┴────┐
  │   Role   │
  │ (角色)   │
  └─────────┘
```

### 枚举定义

| 枚举 | 值 | 说明 |
|------|-----|------|
| UserRole | student, faculty, external, admin | 用户角色 |
| TimeSlot | morning, afternoon, evening | 排班时段 |
| ScheduleStatus | open, full, closed | 排班状态 |
| AppointmentStatus | pending, confirmed, cancelled, completed | 预约状态 |

### 模型详情

#### User (用户)
- 存储用户基本信息和认证凭据
- role 字段区分患者/管理员
- studentId 用于学号/工号

#### Department (科室)
- 科室基本信息（名称、描述、位置）
- isActive 控制是否启用

#### Doctor (医生)
- 关联 User 和 Department
- specialties 存储擅长领域 (JSON)

#### Schedule (排班)
- 按 日期 + 时段 + 医生 唯一
- maxPatients / currentPatients 管理号源
- status 跟踪排班状态

#### Appointment (预约)
- 关联用户、医生、排班
- queueNumber 排队号
- status 跟踪预约状态

#### MedicalRecord (电子病历)
- 一次预约对应一份病历
- 存储诊断、处方、医嘱

#### PrescriptionItem (处方明细)
- 关联病历，存储药品信息

## 认证流程

### 登录流程

```
用户输入手机号+密码
       │
       ▼
NextAuth Credentials Provider
       │
       ▼
数据库查询用户
       │
       ▼
bcrypt 验证密码
       │
       ▼
签发 JWT Token
       │
       ▼
Session 存储用户信息 (id, role)
```

### 权限控制

- 患者页面：`/appointments`, `/records` 等需要登录
- 管理员页面：`/admin/*` 需要 admin 角色
- 公开页面：`/`, `/departments`, `/login`, `/register`

## Server Actions

所有业务逻辑通过 Server Actions 实现，位于 `src/server/actions/`。

| Action | 文件 | 功能 |
|--------|------|------|
| `registerUser` | auth.ts | 用户注册 |
| `createAppointment` | appointment.ts | 创建预约 |
| `cancelAppointment` | appointment.ts | 取消预约 |
| `createSchedule` | schedule.ts | 创建排班 |
| `updateScheduleStatus` | schedule.ts | 更新排班状态 |
| `getDepartments` | department.ts | 获取科室列表 |
| `getDepartmentById` | department.ts | 获取科室详情 |
| `getDoctors` | doctor.ts | 获取医生列表 |
| `getDoctorById` | doctor.ts | 获取医生详情 |
| `createMedicalRecord` | medical-record.ts | 创建病历 |
| `getMedicalRecords` | medical-record.ts | 获取病历列表 |

## 组件架构

### 布局组件
- `Header` - 全局顶栏（导航、用户信息）
- `Footer` - 全局底栏
- `Sidebar` - 管理后台侧边栏

### 业务组件
- `DepartmentCard` - 科室卡片
- `DoctorCard` - 医生卡片
- `AppointmentForm` - 预约表单
- `AppointmentList` - 预约列表
- `ScheduleCalendar` - 排班日历
- `MedicalRecordCard` - 病历卡片

### 图表组件
- `TrendChart` - 预约趋势折线图
- `DepartmentChart` - 科室热度柱状图
- `DoctorChart` - 医生工作量柱状图
- `StatusChart` - 预约状态饼图

## 视觉规范 (UI/UX Pro Max)

### 设计风格
- **风格**：Accessible & Ethical — 医疗 SaaS 极简风
- **原则**：高对比度、大字体、键盘导航友好、WCAG AA 合规

### 颜色系统

所有颜色通过 CSS 变量定义，使用 Tailwind 语义化 Token：

```css
:root {
  --primary: 187 84% 43%;      /* #0891B2 cyan-600 */
  --secondary: 187 72% 54%;    /* #22D3EE cyan-400 */
  --cta: 160 84% 39%;          /* #059669 emerald-600 */
  --background: 180 100% 97%;  /* #ECFEFF cyan-50 */
  --foreground: 198 82% 24%;   /* #164E63 cyan-900 */
}
```

### 间距基准
- 基础单位：4px
- 最大宽度：1280px (max-w-7xl)
- 卡片内边距：24px (p-6)
- 卡片圆角：12px (rounded-xl)

### 交互规范
- Focus Ring：3-4px ring-cyan-500
- 过渡动画：150-300ms
- 最小触摸目标：44x44px

## 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

### Docker 部署

```dockerfile
FROM node:18-alpine AS base
RUN npm i -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```
