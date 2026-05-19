# API 参考文档

本文档描述 SuColMed 项目中所有 Server Actions 的接口定义。

## 认证 (src/server/actions/auth.ts)

### registerUser

用户注册。

**参数：**
```typescript
{
  name: string;          // 姓名（至少 2 字符）
  phone: string;         // 手机号（11 位，1开头）
  password: string;      // 密码（至少 6 位）
  role: "student" | "faculty" | "external";
  studentId?: string;    // 学号/工号（选填）
  email?: string;        // 邮箱（选填）
}
```

**返回：**
```typescript
// 成功
{ success: true; data: { id: string; name: string; phone: string } }

// 失败
{ success: false; error: string }
```

**错误信息：**
- `"姓名至少2个字符"`
- `"请输入有效的11位手机号"`
- `"密码至少6位"`
- `"手机号已注册"`

---

## 预约 (src/server/actions/appointment.ts)

### createAppointment

创建预约。

**参数：**
```typescript
{
  userId: string;        // 用户 UUID
  doctorId: string;      // 医生 UUID
  scheduleId: string;    // 排班 UUID
  symptoms?: string;     // 症状描述（选填，最多 500 字）
}
```

**返回：**
```typescript
// 成功
{ success: true; data: { id: string; queueNumber: number } }

// 失败
{ success: false; error: string }
```

**错误信息：**
- `"排班不存在"`
- `"号源已满或已关闭"`
- `"号源已满"`

**副作用：**
- 创建预约记录
- 更新排班 currentPatients (+1)
- 如果号源满，自动将排班状态设为 "full"

---

### cancelAppointment

取消预约。

**参数：**
```typescript
{
  appointmentId: string; // 预约 UUID
  userId: string;        // 用户 UUID（验证所有权）
}
```

**返回：**
```typescript
// 成功
{ success: true; data: { id: string } }

// 失败
{ success: false; error: string }
```

**错误信息：**
- `"预约不存在或无法取消"`

**限制：**
- 只能取消 pending 或 confirmed 状态的预约

---

## 排班 (src/server/actions/schedule.ts)

### createSchedule

创建排班。

**参数：**
```typescript
{
  doctorId: string;      // 医生 UUID
  date: string;          // 日期（YYYY-MM-DD 格式）
  timeSlot: "morning" | "afternoon" | "evening";
  maxPatients?: number;  // 号源上限（默认 20，最大 100）
}
```

**返回：**
```typescript
// 成功
{ success: true; data: Schedule }

// 失败
{ success: false; error: string }
```

**错误信息：**
- `"该时段排班已存在"`

**约束：**
- 同一医生同一天同一时段不能重复创建

---

### updateScheduleStatus

更新排班状态。

**参数：**
```typescript
{
  scheduleId: string;    // 排班 UUID
  status: "open" | "full" | "closed";
}
```

**返回：**
```typescript
// 成功
{ success: true; data: Schedule }

// 失败
{ success: false; error: string }
```

---

## 科室 (src/server/actions/department.ts)

### getDepartments

获取所有启用的科室列表。

**参数：** 无

**返回：**
```typescript
Department[] // 包含 _count.doctors
```

---

### getDepartmentById

获取科室详情（含医生列表）。

**参数：**
```typescript
id: string // 科室 UUID
```

**返回：**
```typescript
Department | null // 包含 doctors 数组
```

---

### createDepartment

创建科室。

**参数：**
```typescript
{
  name: string;          // 科室名称
  description?: string;  // 科室描述（选填）
  location?: string;     // 位置（选填）
}
```

**返回：**
```typescript
{ success: true; data: Department } | { success: false; error: string }
```

---

### updateDepartment

更新科室信息。

**参数：**
```typescript
id: string
{
  name?: string;
  description?: string;
  location?: string;
  isActive?: boolean;
}
```

**返回：**
```typescript
{ success: true; data: Department } | { success: false; error: string }
```

---

## 医生 (src/server/actions/doctor.ts)

### getDoctors

获取医生列表。

**参数：**
```typescript
departmentId?: string // 按科室筛选（选填）
```

**返回：**
```typescript
Doctor[] // 包含 user 和 department 信息
```

---

### getDoctorById

获取医生详情（含可预约排班）。

**参数：**
```typescript
id: string // 医生 UUID
```

**返回：**
```typescript
Doctor | null // 包含 schedules 数组（仅 open 状态，未来日期）
```

---

### createDoctor

创建医生记录。

**参数：**
```typescript
{
  userId: string;        // 关联的用户 UUID
  departmentId: string;  // 科室 UUID
  title: string;         // 职称
  specialties?: string[];// 擅长领域（选填）
  bio?: string;          // 个人简介（选填）
}
```

**返回：**
```typescript
{ success: true; data: Doctor } | { success: false; error: string }
```

---

## 病历 (src/server/actions/medical-record.ts)

### createMedicalRecord

创建电子病历。

**参数：**
```typescript
{
  appointmentId: string; // 预约 UUID
  doctorId: string;      // 医生 UUID
  diagnosis: string;     // 诊断结果
  prescription?: {       // 处方（选填）
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }[];
  notes?: string;        // 医嘱（选填）
  followUpDate?: string; // 复诊日期 YYYY-MM-DD（选填）
}
```

**返回：**
```typescript
{ success: true; data: MedicalRecord } | { success: false; error: string }
```

**错误信息：**
- `"预约不存在"`
- `"只能为已确认的预约创建病历"`

**副作用：**
- 创建病历记录
- 创建处方明细（如有）
- 更新预约状态为 "completed"

---

### getMedicalRecords

获取用户的所有病历。

**参数：**
```typescript
userId: string // 用户 UUID
```

**返回：**
```typescript
MedicalRecord[] // 包含 doctor、items、appointment 信息
```

---

## 类型定义 (src/types/index.ts)

### 通用类型

```typescript
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };
```

### 页面数据类型

```typescript
type DepartmentListItem = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  _count: { doctors: number };
};

type DoctorListItem = {
  id: string;
  name: string;
  title: string;
  specialties: string[] | null;
  avatar: string | null;
  bio: string | null;
  department: { id: string; name: string };
};

type ScheduleListItem = {
  id: string;
  date: Date;
  timeSlot: TimeSlot;
  maxPatients: number;
  currentPatients: number;
  status: ScheduleStatus;
};

type AppointmentListItem = {
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
```

### 看板数据类型

```typescript
type DashboardStats = {
  totalAppointments: number;
  todayAppointments: number;
  totalDoctors: number;
  totalDepartments: number;
};

type TrendData = { date: string; count: number };
type DepartmentHeatData = { name: string; count: number };
type DoctorWorkloadData = { name: string; count: number };
type StatusDistribution = { status: string; count: number };
```
