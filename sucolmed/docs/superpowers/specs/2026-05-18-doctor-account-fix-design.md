# 医生角色 & 账号创建修复 Spec

**日期：** 2026-05-18
**状态：** 已批准

---

## 1. 问题

### 1.1 医生角色页面访问
- `UserRole` 枚举值：`student`, `faculty`, `external`, `admin` — 没有 `doctor`
- `doctor/layout.tsx` 检查 `role !== "doctor"`，因枚举中无此值永远为真，导致拦截所有用户
- 实际预期：拥有 Doctor 记录的用户应能访问医生工作台

### 1.2 医生账号创建
- `createDoctor` 接收 `userId`（现有 User 的 UUID），admin 无法获知
- 无便捷的医生账号创建流程

---

## 2. 修改方案

### 2.1 Prisma Schema
- `UserRole` 枚举新增 `doctor` 值
- 需创建新 migration

### 2.2 Server Action — `createDoctor`
- 改为接收：`name`, `phone`, `password`, `departmentId`, `title`, `specialties?`, `bio?`
- 事务中先创建 User(role=doctor)，再创建 Doctor 关联
- 校验手机号唯一性、密码加密

### 2.3 Server Action — `deleteDoctor`
- 删除 Doctor 时同时删除关联的 User
- 防止孤儿用户记录

### 2.4 Doctor Layout
- 改为 `role !== "doctor"` 拦截
- 不再依赖 `faculty` 角色

### 2.5 Doctor Form
- 创建时去掉 UserID 字段，替换为：姓名、手机号、密码
- 保持：科室、职称、专长、简介

### 2.6 注册页面
- `registerUser` 已限制 role 为 `student/faculty/external`，保持不变
- doctor 和 admin 不可自行注册

---

## 3. 涉及文件

| 文件 | 操作 |
|------|------|
| `prisma/schema.prisma` | 修改：UserRole 新增 `doctor` |
| `src/server/actions/doctor.ts` | 重写：`createDoctor` 接收用户信息 |
| `src/components/forms/doctor-form.tsx` | 重写：去掉 UUID，改为姓名/手机/密码 |
| `src/app/doctor/layout.tsx` | 修改：简化为 `role !== "doctor"` |
| `src/server/actions/auth.ts` | 无需修改，确认即可 |

---

## 4. 边界
- 用户列表中显示的 "doctor" role 用户不可自行注册
- 删除医生时一并删除 User 账号
- 不修改其他 role（student/faculty/external/admin）的行为
