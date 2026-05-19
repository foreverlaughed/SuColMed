import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppointmentList } from "@/components/appointment-list";

export default async function DoctorAppointmentsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) redirect("/");

  const appointments = await prisma.appointment.findMany({
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
    orderBy: [{ schedule: { date: "desc" } }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">预约管理</h1>
      <AppointmentList appointments={appointments as any} />
    </div>
  );
}
