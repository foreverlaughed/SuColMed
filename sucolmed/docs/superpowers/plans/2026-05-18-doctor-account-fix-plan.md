# Doctor Role & Account Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix doctor role access to doctor pages and redesign doctor account creation so admin can create doctor accounts with name/phone/password instead of requiring a UUID.

**Architecture:** Add `doctor` to UserRole enum in Prisma, rewrite `createDoctor` to accept user credentials and create User + Doctor in a transaction, update doctor layout role check, simplify doctor form.

**Tech Stack:** Prisma 7, Next.js 16 App Router, shadcn/ui, bcryptjs, Zod

**Design Spec:** `docs/superpowers/specs/2026-05-18-doctor-account-fix-design.md`

---

## File Structure

| File | Operation | Responsibility |
|------|-----------|----------------|
| `prisma/schema.prisma` | Modify | Add `doctor` to UserRole enum |
| `src/server/actions/doctor.ts` | Rewrite | `createDoctor` creates User+Doctor in transaction |
| `src/components/forms/doctor-form.tsx` | Rewrite | Form: name, phone, password, department, title, specialties, bio |
| `src/app/doctor/layout.tsx` | Modify | Simplified role check (`role !== "doctor"`) |
| `src/server/actions/auth.ts` | No change needed | Already restricts registration to student/faculty/external |

---

### Task 1: Add `doctor` to UserRole enum + migrate

**Files:**
- Modify: `prisma/schema.prisma` (line 14)

- [ ] **Step 1: Add `doctor` to the UserRole enum**

In `prisma/schema.prisma`, add `doctor` to the enum:

```prisma
enum UserRole {
  student
  faculty
  external
  admin
  doctor
}
```

- [ ] **Step 2: Run migration**

```bash
cd sucolmed
pnpm prisma migrate dev --name add-doctor-role
```

Expected: Migration created successfully

- [ ] **Step 3: Regenerate Prisma client**

```bash
pnpm prisma generate
```

Expected: Prisma client regenerated

- [ ] **Step 4: Verify schema**

```bash
pnpm prisma validate
```

Expected: Your schema is valid

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add doctor role to UserRole enum"
```

---

### Task 2: Rewrite `createDoctor` to accept user credentials

**Files:**
- Modify: `src/server/actions/doctor.ts`

- [ ] **Step 1: Rewrite the file**

Replace the entire file with:

```typescript
"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const doctorSchema = z.object({
  name: z.string().min(2, "姓名至少2个字符"),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的11位手机号"),
  password: z.string().min(6, "密码至少6位"),
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
  name: string;
  phone: string;
  password: string;
  departmentId: string;
  title: string;
  specialties?: string[];
  bio?: string;
}) {
  const parsed = doctorSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const existing = await prisma.user.findUnique({
    where: { phone: input.phone },
  });

  if (existing) {
    return { success: false as const, error: "手机号已被占用" };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const doctor = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        passwordHash,
        role: "doctor",
      },
    });

    return tx.doctor.create({
      data: {
        userId: user.id,
        departmentId: input.departmentId,
        title: input.title,
        specialties: input.specialties ?? [],
        bio: input.bio ?? null,
      },
      include: {
        user: { select: { name: true, phone: true } },
        department: { select: { name: true } },
      },
    });
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

  await prisma.$transaction(async (tx) => {
    await tx.doctor.delete({ where: { id } });
    await tx.user.delete({ where: { id: doctor.userId } });
  });

  return { success: true as const };
}
```

- [ ] **Step 2: Verify no type errors**

```bash
pnpm tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/server/actions/doctor.ts
git commit -m "feat: rewrite createDoctor to accept user credentials"
```

---

### Task 3: Update doctor layout role check

**Files:**
- Modify: `src/app/doctor/layout.tsx`

- [ ] **Step 1: Simplify role check**

Change line 14 from:
```ts
if (role !== "doctor" && role !== "faculty") redirect("/");
```
to:
```ts
if (role !== "doctor") redirect("/");
```

- [ ] **Step 2: Commit**

```bash
git add src/app/doctor/layout.tsx
git commit -m "fix: simplify doctor layout role check to doctor only"
```

---

### Task 4: Rewrite doctor form to accept name/phone/password

**Files:**
- Modify: `src/components/forms/doctor-form.tsx`

- [ ] **Step 1: Rewrite the form component**

Replace the file content with:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState(doctor?.departmentId ?? "");
  const [title, setTitle] = useState(doctor?.title ?? "");
  const [specialties, setSpecialties] = useState(doctor?.specialties?.join(", ") ?? "");
  const [bio, setBio] = useState(doctor?.bio ?? "");

  const isEditing = !!doctor;

  const loadDepartments = useCallback(() => {
    getDepartments().then((res) => {
      setDepartments(res);
    });
  }, []);

  useEffect(() => {
    if (open) {
      loadDepartments();
      if (!isEditing) {
        setName("");
        setPhone("");
        setPassword("");
        setDepartmentId("");
        setTitle("");
        setSpecialties("");
        setBio("");
      }
    }
  }, [open, isEditing, loadDepartments]);

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
          name,
          phone,
          password,
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
          <SheetTitle>{isEditing ? "编辑医生" : "新增医生账号"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isEditing && (
            <>
              <div>
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入医生姓名"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">手机号 *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="11位手机号"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">密码 *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6位密码"
                  className="mt-1"
                  required
                />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="departmentId">所属科室 *</Label>
            <Select
              value={departmentId}
              onValueChange={(value) => setDepartmentId(value ?? "")}
            >
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

- [ ] **Step 2: Verify no type errors**

```bash
pnpm tsc --noEmit
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/doctor-form.tsx
git commit -m "feat: simplify doctor form with name/phone/password instead of UUID"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run type check**

```bash
pnpm tsc --noEmit
```

Expected: No type errors

- [ ] **Step 2: Build check**

```bash
pnpm build
```

Expected: Successful build
