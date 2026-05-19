"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAppointmentSchema = z.object({
  userId: z.string().uuid(),
  doctorId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  symptoms: z.string().max(500).optional(),
});

export async function createAppointment(input: {
  userId: string;
  doctorId: string;
  scheduleId: string;
  symptoms?: string;
}) {
  const parsed = createAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const schedule = await prisma.schedule.findUnique({
    where: { id: input.scheduleId },
  });

  if (!schedule) {
    return { success: false as const, error: "排班不存在" };
  }

  if (schedule.status === "full" || schedule.status === "closed") {
    return { success: false as const, error: "号源已满或已关闭" };
  }

  if (schedule.currentPatients >= schedule.maxPatients) {
    return { success: false as const, error: "号源已满" };
  }

  const existing = await prisma.appointment.findFirst({
    where: {
      userId: input.userId,
      scheduleId: input.scheduleId,
      status: { in: ["pending", "confirmed"] },
    },
  });

  if (existing) {
    return { success: false as const, error: "您已预约该时段，请勿重复预约" };
  }

  const queueNumber = schedule.currentPatients + 1;

  const [appointment] = await prisma.$transaction([
    prisma.appointment.create({
      data: {
        userId: input.userId,
        doctorId: input.doctorId,
        scheduleId: input.scheduleId,
        symptoms: input.symptoms ?? null,
        queueNumber,
        status: "confirmed",
        queueNumberRecord: {
          create: {
            scheduleId: input.scheduleId,
            number: queueNumber,
            status: "waiting",
          },
        },
      },
    }),
    prisma.schedule.update({
      where: { id: input.scheduleId },
      data: {
        currentPatients: { increment: 1 },
        status: schedule.currentPatients + 1 >= schedule.maxPatients ? "full" : "open",
      },
    }),
  ]);

  return { success: true as const, data: { id: appointment.id, queueNumber } };
}

const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function cancelAppointment(input: {
  appointmentId: string;
  userId: string;
}) {
  const parsed = cancelAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: input.appointmentId,
      userId: input.userId,
      status: { in: ["pending", "confirmed"] },
    },
  });

  if (!appointment) {
    return { success: false as const, error: "预约不存在或无法取消" };
  }

  const [updated] = await prisma.$transaction([
    prisma.appointment.update({
      where: { id: input.appointmentId },
      data: { status: "cancelled" },
    }),
    prisma.schedule.update({
      where: { id: appointment.scheduleId },
      data: {
        currentPatients: { decrement: 1 },
        status: "open",
      },
    }),
  ]);

  return { success: true as const, data: { id: updated.id } };
}
