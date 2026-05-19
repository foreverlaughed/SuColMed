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
    return { success: false as const, error: parsed.error.issues[0].message };
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
