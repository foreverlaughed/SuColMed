import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export default async function PatientRecordsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const records = await prisma.medicalRecord.findMany({
    where: { appointment: { userId: session.user.id } },
    include: {
      doctor: {
        include: {
          user: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
      items: true,
      appointment: { select: { createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">我的病历</h1>

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
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {record.doctor.user.name} - {record.doctor.department.name}
                  </CardTitle>
                  <Badge variant="secondary">{record.items.length} 种药品</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{record.diagnosis}</p>
                {record.items.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500">
                    处方：{record.items.map((i) => i.medicineName).join("、")}
                  </div>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(record.createdAt).toLocaleDateString("zh-CN")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
