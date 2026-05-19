"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const medicineSchema = z.object({
  name: z.string().min(1, "药品名称不能为空"),
  category: z.string().min(1, "药品分类不能为空"),
  spec: z.string().min(1, "规格不能为空"),
  unit: z.string().min(1, "单位不能为空"),
  stock: z.number().int().min(0, "库存不能为负数"),
  price: z.number().min(0, "价格不能为负数"),
});

export async function getMedicines(category?: string, search?: string) {
  const where: Record<string, unknown> = { isActive: true };

  if (category) {
    where.category = category;
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const medicines = await prisma.medicine.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return { success: true as const, data: medicines };
}

export async function createMedicine(input: {
  name: string;
  category: string;
  spec: string;
  unit: string;
  stock: number;
  price: number;
}) {
  const parsed = medicineSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const medicine = await prisma.medicine.create({ data: parsed.data });
  return { success: true as const, data: medicine };
}

export async function updateMedicine(
  id: string,
  input: Partial<{
    name: string;
    category: string;
    spec: string;
    unit: string;
    stock: number;
    price: number;
    isActive: boolean;
  }>
) {
  const medicine = await prisma.medicine.update({
    where: { id },
    data: input,
  });
  return { success: true as const, data: medicine };
}

export async function deleteMedicine(id: string) {
  await prisma.medicine.delete({ where: { id } });
  return { success: true as const };
}

export async function reduceStock(medicineId: string, quantity: number) {
  const medicine = await prisma.medicine.findUnique({
    where: { id: medicineId },
  });

  if (!medicine) {
    return { success: false as const, error: "药品不存在" };
  }

  if (medicine.stock < quantity) {
    return { success: false as const, error: "库存不足" };
  }

  const updated = await prisma.medicine.update({
    where: { id: medicineId },
    data: { stock: { decrement: quantity } },
  });

  return { success: true as const, data: updated };
}
