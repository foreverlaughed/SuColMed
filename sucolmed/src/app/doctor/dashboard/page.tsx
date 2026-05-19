import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TodayPanel } from "@/components/doctor/today-panel";
import { AppointmentList } from "@/components/appointment-list";

export default async function DoctorDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) redirect("/");

  const today = new Date().toISOString().split("T")[0];

  const schedules = await prisma.schedule.findMany({
    where: {
      doctorId: doctor.id,
      date: { gte: new Date(today) },
    },
    orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
  });

  const pendingAppointments = await prisma.appointment.count({
    where: {
      doctorId: doctor.id,
      status: "confirmed",
    },
  });

  const recentAppointments = await prisma.appointment.findMany({
    where: { doctorId: doctor.id },
    include: {
      doctor: {
        include: {
          user: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
      schedule: { select: { date: true, timeSlot: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">今日概览</h1>
      <TodayPanel
        doctorId={doctor.id}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schedules={schedules as any}
        pendingAppointments={pendingAppointments}
      />
      <div className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold text-cyan-900">最近预约</h2>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <AppointmentList appointments={recentAppointments as any} />
      </div>
    </div>
  );
}
