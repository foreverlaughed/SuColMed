import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const { scheduleId } = await params;

  const queue = await prisma.queueNumber.findMany({
    where: { scheduleId },
    include: {
      appointment: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { number: "asc" },
  });

  const waiting = queue.filter((q) => q.status === "waiting");
  const called = queue.filter((q) => q.status === "called");
  const completed = queue.filter((q) => q.status === "completed");

  const current = called.length > 0 ? called[called.length - 1] : null;
  const nextInLine = waiting.length > 0 ? waiting[0] : null;

  return NextResponse.json({
    success: true,
    data: {
      current: current
        ? {
            id: current.id,
            number: current.number,
            appointmentId: current.appointmentId,
            patientName: current.appointment?.user.name ?? null,
          }
        : null,
      nextInLine: nextInLine
        ? {
            id: nextInLine.id,
            number: nextInLine.number,
            appointmentId: nextInLine.appointmentId,
            patientName: nextInLine.appointment?.user.name ?? null,
          }
        : null,
      waitingCount: waiting.length,
      completedCount: completed.length,
      queue: queue.slice(0, 20).map((q) => ({
        id: q.id,
        number: q.number,
        appointmentId: q.appointmentId,
        patientName: q.appointment?.user.name ?? null,
        status: q.status,
        calledAt: q.calledAt?.toISOString() ?? null,
      })),
    },
  });
}
