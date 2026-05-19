# SuColMed（宿院医约）— 设计规格文档

> 日期：2026-05-18
> 版本：1.0
> 状态：已确认

---

## 1. 产品定位

**一句话**：面向高校校医院的全人群在线预约平台，让学生、教职工及校外人员（家属等）能便捷地完成挂号预约、查看排队、获取电子病历和处方。

**核心问题**：传统校医院排队挂号效率低、信息不透明，学生课间时间紧，教职工就诊不便。

**目标用户**：

| 角色 | 说明 |
|------|------|
| 学生 | 通过学号登录，预约校医院门诊 |
| 教职工 | 通过工号登录，预约校医院门诊 |
| 校外人员（家属等） | 通过手机号注册，预约校医院门诊 |
| 管理员 | 校医院工作人员，管理科室、排班、数据看板 |

**MVP 成功标准**：

- 患者能在 3 步内完成预约（选科室 → 选医生 → 选时段）
- 管理员能独立完成科室排班设置
- 数据看板能展示预约趋势和科室热度

---

## 2. 全栈技术栈

| 层级 | 选择 | 理由 |
|------|------|------|
| 前端框架 | Next.js 14+ (App Router) | 全栈 TypeScript、SSR/SSG、AI 训练数据最丰富 |
| UI 框架 | Tailwind CSS + shadcn/ui | 类型安全、可定制、无障碍友好 |
| 图标 | Lucide React | 与 shadcn/ui 生态一致 |
| 图表 | Recharts | React 原生、适合管理后台看板 |
| 后端 | Next.js Server Actions + Route Handlers | 无需独立后端进程 |
| ORM | Prisma | 类型安全、Schema-first、AI 友好 |
| 数据库 | PostgreSQL | 可靠、JSON 支持、适合医疗数据 |
| 认证 | NextAuth.js (Auth.js) | 支持 Credentials Provider（手机号+密码） |
| 部署 | Vercel 或 Docker + 云服务器 | 云端部署，公网可访问 |
| 包管理 | pnpm | 快速、节省磁盘 |

---

## 3. 视觉规范（UI/UX Pro Max 设计系统）

### 3.1 风格定位

**风格**：Accessible & Ethical — 医疗 SaaS 极简风

**核心原则**：
- 高对比度、大字体（16px+）、键盘导航友好
- WCAG AAA 合规
- 语义化 HTML、屏幕阅读器友好
- 清晰的 focus ring（3-4px）
- 44x44px 最小触摸目标

### 3.2 配色方案

| 用途 | 色值 | Tailwind 类 | 说明 |
|------|------|-------------|------|
| Primary | `#0891B2` | `cyan-600` | 主色调，传递医疗专业感 |
| Secondary | `#22D3EE` | `cyan-400` | 辅助色，用于次要元素 |
| CTA | `#059669` | `emerald-600` | 操作按钮，引导正向操作 |
| Background | `#ECFEFF` | `cyan-50` | 页面背景 |
| Text | `#164E63` | `cyan-900` | 正文文字 |
| Muted Text | `#475569` | `slate-600` | 次要文字 |
| Border | `#E2E8F0` | `slate-200` | 边框 |
| Success | `#22C55E` | `green-500` | 成功状态 |
| Warning | `#F59E0B` | `amber-500` | 警告状态 |
| Error | `#EF4444` | `red-500` | 错误状态 |

**设计语义**：青色系（Cyan）传递医疗专业感与信赖感，绿色 CTA 引导「确认预约」等正向操作。

### 3.3 字体方案

| 用途 | 字体 | Weight |
|------|------|--------|
| 标题 | Figtree | 400, 500, 600, 700 |
| 正文 | Noto Sans | 300, 400, 500, 700 |

**CSS Import**:
```css
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;700&display=swap');
```

**Tailwind Config**:
```js
fontFamily: {
  heading: ['Figtree', 'sans-serif'],
  body: ['Noto Sans', 'sans-serif'],
}
```

### 3.4 间距与排版基准

| 属性 | 值 |
|------|-----|
| 基础间距单位 | 4px（Tailwind 基数） |
| 页面最大宽度 | `max-w-7xl`（1280px） |
| 卡片内边距 | `p-6`（24px） |
| 卡片圆角 | `rounded-xl`（12px） |
| 按钮圆角 | `rounded-lg`（8px） |
| 行高 | Heading: 1.2 / Body: 1.6 |
| 正文字号 | 16px base / 15px small |
| 标题字号 | H1: 32px / H2: 24px / H3: 20px |

### 3.5 关键效果

- **Focus Ring**: 3-4px `ring-cyan-500`
- **过渡动画**: 150-300ms `transition-colors`
- **尊重** `prefers-reduced-motion`

### 3.6 反模式（禁止）

- 禁止霓虹色、AI 紫/粉渐变
- 禁止 emoji 作为 UI 图标（使用 Lucide SVG）
- 禁止无反馈的表单提交
- 禁止仅 placeholder 无 label 的输入框
- 禁止 hover 时使用 `scale` 变换导致布局偏移

---

## 4. 核心数据实体关系

### 4.1 ER 关系图

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

### 4.2 枚举定义

| 枚举名 | 值 | 说明 |
|--------|-----|------|
| UserRole | student / faculty / external / admin | 用户角色 |
| TimeSlot | morning / afternoon / evening | 排班时段 |
| ScheduleStatus | open / full / closed | 排班状态 |
| AppointmentStatus | pending / confirmed / cancelled / completed | 预约状态 |

### 4.3 实体定义

#### User（用户）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | String | required | 姓名 |
| role | Enum | required | student / faculty / external / admin |
| studentId | String? | unique | 学号/工号，admin/external 为 null |
| phone | String | unique, required | 手机号（登录凭证） |
| email | String? | unique | 邮箱 |
| passwordHash | String | required | 密码哈希 |
| createdAt | DateTime | default now | 创建时间 |
| updatedAt | DateTime | auto | 更新时间 |

#### Department（科室）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | String | required | 科室名称（如：内科、外科） |
| description | String? | | 科室介绍 |
| location | String? | | 楼栋/房间号 |
| isActive | Boolean | default true | 是否启用 |
| createdAt | DateTime | default now | |
| updatedAt | DateTime | auto | |

#### Doctor（医生）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| userId | UUID | FK → User | 关联用户账号 |
| departmentId | UUID | FK → Department | 所属科室 |
| title | String | required | 职称（主任/副主任/主治/住院医师） |
| specialties | JSON | | 擅长领域列表 |
| avatar | String? | | 头像 URL |
| bio | String? | | 个人简介 |
| createdAt | DateTime | default now | |
| updatedAt | DateTime | auto | |

#### Schedule（排班）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| doctorId | UUID | FK → Doctor | 关联医生 |
| date | Date | required | 排班日期 |
| timeSlot | Enum | required | morning / afternoon / evening |
| maxPatients | Int | default 20 | 号源上限 |
| currentPatients | Int | default 0 | 已预约数 |
| status | Enum | default open | open / full / closed |
| createdAt | DateTime | default now | |
| updatedAt | DateTime | auto | |

**约束**：doctorId + date + timeSlot 唯一（同一医生同一天同一时段不能重复排班）。

#### Appointment（预约）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| userId | UUID | FK → User | 预约人 |
| doctorId | UUID | FK → Doctor | 预约医生 |
| scheduleId | UUID | FK → Schedule | 关联排班 |
| status | Enum | default pending | pending / confirmed / cancelled / completed |
| symptoms | String? | | 症状描述 |
| queueNumber | Int? | | 排队号（确认后分配） |
| createdAt | DateTime | default now | |
| updatedAt | DateTime | auto | |

#### MedicalRecord（电子病历）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| appointmentId | UUID | FK → Appointment, unique | 一次就诊一份病历 |
| doctorId | UUID | FK → Doctor | 就诊医生 |
| diagnosis | String | required | 诊断结果 |
| prescription | JSON | | 处方（结构化数据） |
| notes | String? | | 医嘱 |
| followUpDate | Date? | | 复诊日期 |
| createdAt | DateTime | default now | |

#### PrescriptionItem（处方明细）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| medicalRecordId | UUID | FK → MedicalRecord | 关联病历 |
| medicineName | String | required | 药品名称 |
| dosage | String | required | 剂量（如：500mg） |
| frequency | String | required | 频次（如：每日三次） |
| duration | String | required | 疗程（如：7天） |
| notes | String? | | 用药说明 |

### 4.4 关系总结

| 关系 | 类型 | 说明 |
|------|------|------|
| User → Appointment | 1:N | 一个用户可多次预约 |
| Doctor → Schedule | 1:N | 一个医生多个排班 |
| Schedule → Appointment | 1:N | 一个时段可多人预约（受 maxPatients 限制） |
| Appointment → MedicalRecord | 1:1 | 一次就诊一份病历 |
| MedicalRecord → PrescriptionItem | 1:N | 一份处方多种药品 |
| Doctor → Department | N:1 | 一个科室多名医生 |
| Doctor → User | 1:1 | 一个医生对应一个用户账号 |

---

## 5. MVP 页面结构

| 路由 | 页面 | 角色 | 功能 |
|------|------|------|------|
| `/` | 首页 | 所有人 | 科室导航、快速预约入口、公告 |
| `/login` | 登录 | 所有人 | 手机号 + 密码登录 |
| `/register` | 注册 | 患者 | 手机号注册、填写基本信息 |
| `/departments` | 科室列表 | 患者 | 查看所有科室及位置 |
| `/departments/[id]` | 科室详情 | 患者 | 科室介绍、医生列表 |
| `/doctors/[id]` | 医生详情 | 患者 | 医生简介、可预约时段列表 |
| `/appointments/new` | 创建预约 | 患者 | 选科室 → 选医生 → 选时段 → 确认 |
| `/appointments` | 我的预约 | 患者 | 查看/取消/改签预约 |
| `/records` | 我的病历 | 患者 | 查看历史病历和处方 |
| `/admin/schedules` | 排班管理 | 管理员 | 设置科室排班、号源数量 |
| `/admin/doctors` | 医生管理 | 管理员 | 添加/编辑医生信息 |
| `/admin/departments` | 科室管理 | 管理员 | 添加/编辑科室信息 |
| `/admin/dashboard` | 数据看板 | 管理员 | 预约趋势、科室热度、医生工作量 |

---

## 6. MVP 功能清单

### 6.1 预约挂号（患者）

- 选择科室 → 浏览该科室医生列表
- 选择医生 → 查看可预约日期和时段
- 选择时段 → 填写症状描述 → 确认预约
- 预约成功后显示排队号

### 6.2 预约管理（患者）

- 查看「我的预约」列表（按状态分组：待确认/已确认/已完成/已取消）
- 取消预约（就诊前可取消）
- 改签预约（取消旧的 + 创建新的）

### 6.3 排班管理（管理员）

- 按科室、医生查看排班日历
- 批量设置排班（选择日期范围 + 时段 + 号源上限）
- 开放/关闭特定排班

### 6.4 电子病历/处方（医生/患者）

- 医生在就诊完成后填写：诊断、处方（多药品）、医嘱、复诊日期
- 患者在「我的病历」中查看历史记录
- 处方以结构化列表展示（药品名、剂量、频次、疗程）

### 6.5 数据统计看板（管理员）

- **预约趋势**：折线图，近 7 天/30 天预约量变化
- **科室热度**：柱状图，各科室预约量对比
- **医生工作量**：柱状图，各医生接诊量
- **预约状态分布**：饼图/环形图，各状态占比

---

## 7. 非功能性需求

| 维度 | 要求 |
|------|------|
| 无障碍 | WCAG AA 合规（部分 AAA） |
| 响应式 | 支持 375px / 768px / 1024px / 1440px |
| 性能 | 首屏 LCP < 2.5s |
| 安全 | 密码 bcrypt 哈希、CSRF 防护、SQL 注入防护 |
| 浏览器 | Chrome / Firefox / Safari / Edge 最新两个版本 |

---

## 8. 不做的事（YAGNI）

MVP 阶段明确排除：

- 校园 SSO 登录（后续接入）
- 微信/短信通知（后续接入）
- 在线支付（校医院免费或线下缴费）
- 多语言支持（仅中文）
- 移动端 App（先做响应式 Web）
- AI 智能分诊（超出 MVP 范围）
- 号源实时推送（轮询即可，不做 WebSocket）

---

## 9. 待确认项

| 项目 | 状态 | 备注 |
|------|------|------|
| 校医院具体科室列表 | 待确认 | 开发时用示例数据，后续替换 |
| 每日号源上限 | 待确认 | 默认 20，管理员可调 |
| 预约提前天数 | 待确认 | 建议 7 天 |
| 取消预约截止时间 | 待确认 | 建议就诊前 2 小时 |
