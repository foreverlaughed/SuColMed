# 宿院医约 SuColMed

面向高校校医院的全人群在线预约平台，让学生、教职工及校外人员（家属等）能便捷地完成挂号预约、查看排队、获取电子病历和处方。

## 功能特性

### 患者端
- **在线预约**：选择科室 → 选医生 → 选时段 → 确认预约，3 步完成
- **预约管理**：查看/取消/改签已有预约
- **电子病历**：查看历史就诊记录和处方
- **评价医生**：就诊完成后对医生进行评分和评价

### 医生端
- **今日概览**：查看今日排班、待诊患者、当前时段
- **排队叫号**：实时查看队列状态，一键叫号
- **病历书写**：填写诊断结果、开处方、设置复诊日期
- **预约管理**：查看和管理患者预约

### 管理员端
- **排班管理**：按科室、医生设置排班，管理号源
- **医生管理**：添加/编辑/删除医生信息
- **科室管理**：添加/编辑/删除科室信息
- **药品管理**：药品增删改查、库存预警
- **数据看板**：预约趋势、科室热度、医生工作量、状态分布

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| UI 组件 | shadcn/ui, Lucide React |
| 图表 | Recharts |
| 后端 | Next.js Server Actions, API Routes |
| ORM | Prisma 7 |
| 数据库 | PostgreSQL |
| 认证 | NextAuth.js (Auth.js v5) |
| 单元测试 | Vitest |
| E2E 测试 | Playwright |
| 包管理 | pnpm |

## 快速开始

### 环境要求

- Node.js 18+
- pnpm
- PostgreSQL

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd sucolmed

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库连接信息
```

### 数据库设置

```bash
# 生成 Prisma Client
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate dev --name init

# 填充种子数据
pnpm prisma db seed
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

### 测试账号

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 管理员 | 13800000000 | admin123 |
| 学生 | 13800000001 | 123456 |
| 医生 | 13800000010 | 123456 |

## 项目结构

```
sucolmed/
├── prisma/
│   ├── schema.prisma          # 数据模型定义
│   └── seed.ts                # 种子数据
├── src/
│   ├── app/                   # Next.js App Router 页面
│   │   ├── admin/             # 管理后台
│   │   │   ├── dashboard/     # 数据看板
│   │   │   ├── departments/   # 科室管理
│   │   │   ├── doctors/       # 医生管理
│   │   │   ├── medicines/     # 药品管理
│   │   │   └── schedules/     # 排班管理
│   │   ├── api/               # API Routes
│   │   │   └── queue/         # 排队叫号 API
│   │   ├── doctor/            # 医生工作台
│   │   │   ├── dashboard/     # 今日概览
│   │   │   ├── queue/         # 排队叫号
│   │   │   └── records/       # 病历管理
│   │   ├── patient/           # 患者中心
│   │   │   ├── appointments/  # 我的预约
│   │   │   ├── new-appointment/ # 预约挂号
│   │   │   ├── records/       # 我的病历
│   │   │   └── reviews/       # 我的评价
│   │   ├── login/             # 登录
│   │   └── register/          # 注册
│   ├── components/            # React 组件
│   │   ├── charts/            # 图表组件
│   │   ├── doctor/            # 医生端组件
│   │   ├── forms/             # 表单组件
│   │   ├── layout/            # 布局组件
│   │   ├── patient/           # 患者端组件
│   │   └── ui/                # shadcn/ui 组件
│   ├── lib/                   # 工具库
│   │   ├── api-handler.ts     # API 错误处理
│   │   ├── auth.ts            # NextAuth 配置
│   │   ├── error.ts           # AppError 错误类
│   │   └── prisma.ts          # Prisma 单例
│   ├── server/actions/        # Server Actions
│   │   ├── appointment.ts     # 预约相关
│   │   ├── department.ts      # 科室相关
│   │   ├── doctor.ts          # 医生相关
│   │   ├── medical-record.ts  # 病历相关
│   │   ├── medicine.ts        # 药品相关
│   │   ├── queue.ts           # 排队相关
│   │   ├── review.ts          # 评价相关
│   │   └── schedule.ts        # 排班相关
│   └── types/                 # TypeScript 类型
├── tests/                     # 测试文件
│   ├── e2e/                   # Playwright E2E 测试
│   │   ├── admin/             # 管理员端测试
│   │   ├── doctor/            # 医生端测试
│   │   ├── patient/           # 患者端测试
│   │   └── integration/       # 集成测试
│   └── server/                # Vitest 单元测试
├── docs/                      # 项目文档
└── .codestable/               # CodeStable 知识库
```

## 页面路由

| 路由 | 页面 | 角色 | 功能 |
|------|------|------|------|
| `/` | 首页 | 所有人 | 科室导航、快速预约入口 |
| `/login` | 登录 | 所有人 | 手机号 + 密码登录 |
| `/register` | 注册 | 患者 | 手机号注册 |
| `/departments` | 科室列表 | 患者 | 查看所有科室 |
| `/departments/[id]` | 科室详情 | 患者 | 科室介绍、医生列表 |
| `/doctors/[id]` | 医生详情 | 患者 | 医生简介、可预约时段 |
| `/patient/new-appointment` | 预约挂号 | 患者 | 三步预约向导 |
| `/patient/appointments` | 我的预约 | 患者 | 查看/取消/评价预约 |
| `/patient/records` | 我的病历 | 患者 | 查看历史病历和处方 |
| `/patient/reviews` | 我的评价 | 患者 | 查看/提交医生评价 |
| `/doctor/dashboard` | 今日概览 | 医生 | 今日排班、待诊患者 |
| `/doctor/queue` | 排队叫号 | 医生 | 实时队列、一键叫号 |
| `/doctor/records` | 病历管理 | 医生 | 查看/创建病历 |
| `/admin/dashboard` | 数据看板 | 管理员 | 预约趋势、科室热度等 |
| `/admin/departments` | 科室管理 | 管理员 | 添加/编辑/删除科室 |
| `/admin/doctors` | 医生管理 | 管理员 | 添加/编辑/删除医生 |
| `/admin/schedules` | 排班管理 | 管理员 | 设置科室排班 |
| `/admin/medicines` | 药品管理 | 管理员 | 药品增删改查 |

## 设计规范

### 配色方案

| 用途 | 色值 | Tailwind |
|------|------|----------|
| Primary | `#0891B2` | `cyan-600` |
| Secondary | `#22D3EE` | `cyan-400` |
| CTA | `#059669` | `emerald-600` |
| Background | `#ECFEFF` | `cyan-50` |
| Text | `#164E63` | `cyan-900` |

### 字体

- 标题：Figtree
- 正文：Noto Sans

## 开发命令

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器
pnpm lint             # 运行 ESLint
pnpm tsc --noEmit     # TypeScript 类型检查
pnpm vitest run       # 运行单元测试
pnpm exec playwright test  # 运行 E2E 测试
pnpm prisma studio    # 打开 Prisma Studio
pnpm prisma migrate dev    # 运行数据库迁移
pnpm prisma generate       # 生成 Prisma Client
```

## 数据模型

### 核心模型

| 模型 | 说明 |
|------|------|
| `User` | 用户（患者/管理员），含角色字段 |
| `Department` | 科室 |
| `Doctor` | 医生，关联用户和科室 |
| `Schedule` | 排班，按日期+时段管理号源 |
| `Appointment` | 预约，关联患者、医生、排班 |
| `MedicalRecord` | 病历，关联预约和医生 |
| `PrescriptionItem` | 处方项，关联病历和药品 |

### 新增模型

| 模型 | 说明 |
|------|------|
| `Review` | 患者评价，1-5 星评分 + 评论 |
| `Medicine` | 药品，含库存和价格 |
| `QueueNumber` | 排队号码，实时叫号状态 |

### 枚举类型

| 枚举 | 值 |
|------|-----|
| `UserRole` | student, faculty, external, admin |
| `TimeSlot` | morning, afternoon, evening |
| `ScheduleStatus` | open, full, closed |
| `AppointmentStatus` | pending, confirmed, cancelled, completed |
| `QueueStatus` | waiting, called, completed, missed |

## License

MIT
