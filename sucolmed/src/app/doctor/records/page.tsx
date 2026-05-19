import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecordsView } from "@/components/doctor/records-view";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default async function DoctorRecordsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) redirect("/");

  const records = await prisma.medicalRecord.findMany({
    where: { doctorId: doctor.id },
    include: {
      appointment: {
        include: {
          user: { select: { name: true } },
        },
      },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySchedule = await prisma.schedule.findFirst({
    where: {
      doctorId: doctor.id,
      date: { gte: today },
      OR: [{ status: "open" }, { status: "full" }],
    },
    orderBy: { date: "asc" },
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">病历管理</h1>

      {todaySchedule && (
        <RecordsView
          scheduleId={todaySchedule.id}
          doctorId={doctor.id}
        />
      )}

      <h2 className="mb-4 mt-8 font-heading text-lg font-semibold text-cyan-900">历史病历</h2>

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">暂无病历记录</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {record.appointment.user.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(record.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <div className="text-sm text-slate-500">
                    {record.items.length} 种药品
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600">{record.diagnosis}</p>
                {record.items.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500">
                    处方：{record.items.map((i) => i.medicineName).join("、")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
