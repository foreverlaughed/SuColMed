"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { TimeSlot, ScheduleStatus } from "@prisma/client";

const createScheduleSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.enum(["morning", "afternoon", "evening"]),
  maxPatients: z.number().min(1).max(100).default(20),
});

export async function createSchedule(input: {
  doctorId: string;
  date: string;
  timeSlot: string;
  maxPatients?: number;
}) {
  const parsed = createScheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const existing = await prisma.schedule.findUnique({
    where: {
      doctorId_date_timeSlot: {
        doctorId: input.doctorId,
        date: new Date(input.date),
        timeSlot: input.timeSlot as TimeSlot,
      },
    },
  });

  if (existing) {
    return { success: false as const, error: "该时段排班已存在" };
  }

  const schedule = await prisma.schedule.create({
    data: {
      doctorId: input.doctorId,
      date: new Date(input.date),
      timeSlot: input.timeSlot as TimeSlot,
      maxPatients: input.maxPatients ?? 20,
    },
  });

  return { success: true as const, data: schedule };
}

export async function updateScheduleStatus(input: {
  scheduleId: string;
  status: ScheduleStatus;
}) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: input.scheduleId },
  });

  if (!schedule) {
    return { success: false as const, error: "排班不存在" };
  }

  const updated = await prisma.schedule.update({
    where: { id: input.scheduleId },
    data: { status: input.status },
  });

  return { success: true as const, data: updated };
}

export async function deleteSchedule(id: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: { _count: { select: { appointments: true } } },
  });

  if (!schedule) {
    return { success: false as const, error: "排班不存在" };
  }

  if (schedule._count.appointments > 0) {
    return { success: false as const, error: "该排班已有预约，无法删除" };
  }

  await prisma.schedule.delete({ where: { id } });
  return { success: true as const };
}
