import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QueuePanel } from "@/components/doctor/queue-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default async function DoctorQueuePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) redirect("/");

  const today = new Date().toISOString().split("T")[0];

  const todaySchedule = await prisma.schedule.findFirst({
    where: {
      doctorId: doctor.id,
      date: { gte: new Date(today) },
      OR: [{ status: "open" }, { status: "full" }],
    },
    orderBy: { date: "asc" },
  });

  if (!todaySchedule) {
    return (
      <div>
        <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">排队叫号</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">今日无开放排班</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">排队叫号</h1>
      <QueuePanel scheduleId={todaySchedule.id} doctorId={doctor.id} />
    </div>
  );
}
