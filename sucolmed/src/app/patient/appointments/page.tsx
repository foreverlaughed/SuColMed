import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export default async function PatientAppointmentsPage() {
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

  const statusLabels: Record<string, string> = {
    pending: "待确认",
    confirmed: "已确认",
    cancelled: "已取消",
    completed: "已完成",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-slate-100 text-slate-500",
    completed: "bg-blue-100 text-blue-800",
  };

  const timeSlotLabels: Record<string, string> = {
    morning: "上午",
    afternoon: "下午",
    evening: "晚间",
  };

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">我的预约</h1>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">暂无预约记录</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {apt.doctor.user.name} - {apt.doctor.department.name}
                  </CardTitle>
                  <Badge className={statusColors[apt.status]}>
                    {statusLabels[apt.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">
                  {new Date(apt.schedule.date).toLocaleDateString("zh-CN")}{" "}
                  {timeSlotLabels[apt.schedule.timeSlot]}
                </p>
                {apt.symptoms && (
                  <p className="mt-1 text-xs text-slate-400">症状：{apt.symptoms}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
