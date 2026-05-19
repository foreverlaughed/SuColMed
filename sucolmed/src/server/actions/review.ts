"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function createReview(input: {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment?: string;
}) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
  });

  if (!appointment) {
    return { success: false as const, error: "预约不存在" };
  }

  if (appointment.status !== "completed") {
    return { success: false as const, error: "只能评价已完成的预约" };
  }

  if (appointment.userId !== input.patientId) {
    return { success: false as const, error: "无权评价此预约" };
  }

  const existing = await prisma.review.findUnique({
    where: { appointmentId: input.appointmentId },
  });

  if (existing) {
    return { success: false as const, error: "已评价过此预约" };
  }

  const review = await prisma.review.create({
    data: {
      appointmentId: input.appointmentId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      rating: input.rating,
      comment: input.comment ?? null,
    },
  });

  return { success: true as const, data: review };
}

export async function getDoctorReviews(doctorId: string) {
  const reviews = await prisma.review.findMany({
    where: { doctorId },
    include: {
      patient: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = await prisma.review.aggregate({
    where: { doctorId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    success: true as const,
    data: {
      reviews,
      averageRating: stats._avg.rating ?? 0,
      totalReviews: stats._count.rating,
    },
  };
}

export async function getPatientReviews(patientId: string) {
  const reviews = await prisma.review.findMany({
    where: { patientId },
    include: {
      doctor: {
        include: {
          user: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true as const, data: reviews };
}
