"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const prescriptionItemSchema = z.object({
  medicineName: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  notes: z.string().optional(),
});

const createRecordSchema = z.object({
  appointmentId: z.string().uuid(),
  doctorId: z.string().uuid(),
  diagnosis: z.string().min(1, "诊断结果不能为空"),
  prescription: z.array(prescriptionItemSchema).optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
});

export async function createMedicalRecord(input: {
  appointmentId: string;
  doctorId: string;
  diagnosis: string;
  prescription?: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }[];
  notes?: string;
  followUpDate?: string;
}) {
  const parsed = createRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
  });

  if (!appointment) {
    return { success: false as const, error: "预约不存在" };
  }

  if (appointment.status !== "confirmed") {
    return { success: false as const, error: "只能为已确认的预约创建病历" };
  }

  const record = await prisma.$transaction(async (tx) => {
    const medicalRecord = await tx.medicalRecord.create({
      data: {
        appointmentId: input.appointmentId,
        doctorId: input.doctorId,
        diagnosis: input.diagnosis,
        notes: input.notes ?? null,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      },
    });

    if (input.prescription && input.prescription.length > 0) {
      await tx.prescriptionItem.createMany({
        data: input.prescription.map((item) => ({
          medicalRecordId: medicalRecord.id,
          ...item,
        })),
      });
    }

    await tx.appointment.update({
      where: { id: input.appointmentId },
      data: { status: "completed" },
    });

    await tx.queueNumber.updateMany({
      where: { appointmentId: input.appointmentId },
      data: { status: "completed" },
    });

    return medicalRecord;
  });

  return { success: true as const, data: record };
}

export async function updateMedicalRecord(input: {
  recordId: string;
  doctorId: string;
  diagnosis: string;
  prescription?: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
  }[];
  notes?: string;
  followUpDate?: string;
}) {
  const record = await prisma.medicalRecord.findUnique({
    where: { id: input.recordId },
  });

  if (!record) {
    return { success: false as const, error: "病历不存在" };
  }

  if (record.doctorId !== input.doctorId) {
    return { success: false as const, error: "只能编辑自己的病历" };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const medRecord = await tx.medicalRecord.update({
      where: { id: input.recordId },
      data: {
        diagnosis: input.diagnosis,
        notes: input.notes ?? null,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      },
    });

    await tx.prescriptionItem.deleteMany({
      where: { medicalRecordId: input.recordId },
    });

    if (input.prescription && input.prescription.length > 0) {
      await tx.prescriptionItem.createMany({
        data: input.prescription.map((item) => ({
          medicalRecordId: medRecord.id,
          ...item,
        })),
      });
    }

    return medRecord;
  });

  return { success: true as const, data: updated };
}

export async function getMedicalRecordByAppointment(appointmentId: string) {
  const record = await prisma.medicalRecord.findUnique({
    where: { appointmentId },
    include: { items: true },
  });
  return record;
}

export async function getMedicalRecords(userId: string) {
  const records = await prisma.medicalRecord.findMany({
    where: {
      appointment: { userId },
    },
    include: {
      doctor: { select: { title: true, user: { select: { name: true } } } },
      items: true,
      appointment: { select: { createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return records;
}
