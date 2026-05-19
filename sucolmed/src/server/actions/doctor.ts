"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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

  revalidatePath("/admin/doctors");
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
    include: { _count: { select: { appointments: true, medicalRecords: true, schedules: true } } },
  });

  if (!doctor) {
    return { success: false as const, error: "医生不存在" };
  }

  if (doctor._count.schedules > 0) {
    return { success: false as const, error: "该医生有关联的排班，无法删除" };
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
