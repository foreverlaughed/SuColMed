import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { TrendChart } from "@/components/charts/trend-chart";
import { DepartmentChart } from "@/components/charts/department-chart";
import { DoctorChart } from "@/components/charts/doctor-chart";
import { StatusChart } from "@/components/charts/status-chart";
import { CalendarDays, Users, Building2, Activity } from "lucide-react";

export default async function DashboardPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const today = new Date(now.toISOString().split("T")[0]);

  const [totalAppointments, todayAppointments, totalDoctors, totalDepartments] =
    await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.doctor.count(),
      prisma.department.count({ where: { isActive: true } }),
    ]);

  const trendRaw = await prisma.appointment.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: true,
  });

  const trendData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    const found = trendRaw.find(
      (r) => r.createdAt.toISOString().split("T")[0] === dateStr
    );
    return { date: dateStr.slice(5), count: found?._count || 0 };
  });

  const deptHeat = await prisma.appointment.groupBy({
    by: ["doctorId"],
    _count: true,
  });

  const doctorsWithDept = await prisma.doctor.findMany({
    include: {
      user: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  const deptMap = new Map<string, { name: string; count: number }>();
  for (const d of deptHeat) {
    const doc = doctorsWithDept.find((doc) => doc.id === d.doctorId);
    if (doc) {
      const name = doc.department.name;
      const existing = deptMap.get(name);
      deptMap.set(name, {
        name,
        count: (existing?.count || 0) + d._count,
      });
    }
  }
  const departmentData = Array.from(deptMap.values()).sort(
    (a, b) => b.count - a.count
  );

  const doctorWorkload = await prisma.appointment.groupBy({
    by: ["doctorId"],
    _count: true,
    orderBy: { _count: { doctorId: "desc" } },
    take: 10,
  });

  const doctorData = doctorWorkload.map((d) => {
    const doc = doctorsWithDept.find((doc) => doc.id === d.doctorId);
    return { name: doc?.user?.name || "Unknown", count: d._count };
  });

  const statusDist = await prisma.appointment.groupBy({
    by: ["status"],
    _count: true,
  });

  const statusData = statusDist.map((s) => ({
    status: s.status,
    count: s._count,
  }));

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">
        数据看板
      </h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "总预约数", value: totalAppointments, icon: CalendarDays },
          { label: "今日预约", value: todayAppointments, icon: Activity },
          { label: "医生总数", value: totalDoctors, icon: Users },
          { label: "科室总数", value: totalDepartments, icon: Building2 },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-cyan-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <TrendChart data={trendData} title="预约趋势（近30天）" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <DepartmentChart data={departmentData} title="科室热度" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <DoctorChart data={doctorData} title="医生工作量 TOP10" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <StatusChart data={statusData} title="预约状态分布" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
