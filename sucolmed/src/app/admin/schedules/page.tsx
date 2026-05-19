import { prisma } from "@/lib/prisma";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { ScheduleForm } from "@/components/forms/schedule-form";

export default async function SchedulesPage() {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: { select: { name: true } },
      department: { select: { name: true } },
      schedules: {
        orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-cyan-900">排班管理</h1>
        <ScheduleForm doctors={doctors} />
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ScheduleCalendar doctors={doctors as any} />
    </div>
  );
}
