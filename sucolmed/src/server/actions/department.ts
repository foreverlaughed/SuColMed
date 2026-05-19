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
          user: { select: { name: true } },
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
    return { success: false as const, error: parsed.error.issues[0].message };
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
