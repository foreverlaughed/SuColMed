"use server";

import { prisma } from "@/lib/prisma";

export async function createQueueNumber(scheduleId: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    return { success: false as const, error: "排班不存在" };
  }

  const count = await prisma.queueNumber.count({
    where: { scheduleId },
  });

  const queueNumber = await prisma.queueNumber.create({
    data: {
      scheduleId,
      number: count + 1,
      status: "waiting",
    },
  });

  return { success: true as const, data: queueNumber };
}

export async function callNextNumber(scheduleId: string) {
  const next = await prisma.queueNumber.findFirst({
    where: {
      scheduleId,
      status: "waiting",
    },
    orderBy: { number: "asc" },
  });

  if (!next) {
    return { success: false as const, error: "没有等待中的患者" };
  }

  const updated = await prisma.queueNumber.update({
    where: { id: next.id },
    data: {
      status: "called",
      calledAt: new Date(),
    },
  });

  return { success: true as const, data: updated };
}

export async function getQueueStatus(scheduleId: string) {
  const queue = await prisma.queueNumber.findMany({
    where: { scheduleId },
    orderBy: { number: "asc" },
  });

  const waiting = queue.filter((q) => q.status === "waiting");
  const called = queue.filter((q) => q.status === "called");
  const completed = queue.filter((q) => q.status === "completed");

  const current = called.length > 0 ? called[called.length - 1] : null;
  const currentWaiting = waiting.length > 0 ? waiting[0] : null;

  return {
    success: true as const,
    data: {
      current,
      nextInLine: currentWaiting,
      waitingCount: waiting.length,
      completedCount: completed.length,
      queue: queue.slice(0, 20),
    },
  };
}

export async function completeQueueNumber(queueId: string) {
  const updated = await prisma.queueNumber.update({
    where: { id: queueId },
    data: { status: "completed" },
  });

  return { success: true as const, data: updated };
}
