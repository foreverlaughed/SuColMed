import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppointmentList } from "@/components/appointment-list";

export default async function AppointmentsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const appointments = await prisma.appointment.findMany({
    where: { userId: session.user.id },
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
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 font-heading text-3xl font-bold text-cyan-900">我的预约</h1>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AppointmentList appointments={appointments as any} />
    </div>
  );
}
