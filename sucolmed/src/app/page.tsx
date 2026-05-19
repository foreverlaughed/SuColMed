import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DepartmentCard } from "@/components/department-card";
import { getDepartments } from "@/server/actions/department";
import { auth } from "@/lib/auth";
import { CalendarDays, FileText, BarChart3 } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = (session.user as any).role;
    if (role === "admin") redirect("/admin/dashboard");
    if (role === "doctor") redirect("/doctor/dashboard");
  }

  const departments = await getDepartments();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <section className="mb-16 text-center">
        <h1 className="font-heading text-4xl font-bold text-cyan-900 md:text-5xl">
          宿院医约
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          高校校医院在线预约平台 — 轻松挂号，告别排队
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/departments" className="cursor-pointer">
            <Button size="lg" className="bg-primary text-white cursor-pointer">
              <CalendarDays className="mr-2 h-5 w-5" />
              立即预约
            </Button>
          </Link>
          <Link href="/records" className="cursor-pointer">
            <Button size="lg" variant="outline" className="cursor-pointer">
              <FileText className="mr-2 h-5 w-5" />
              查看病历
            </Button>
          </Link>
        </div>
      </section>

      <section className="mb-16 grid gap-6 md:grid-cols-3">
        {[
          { icon: CalendarDays, title: "在线预约", desc: "选择科室、医生和时段，3步完成预约" },
          { icon: FileText, title: "电子病历", desc: "就诊记录和处方随时查看，不怕丢失" },
          { icon: BarChart3, title: "数据看板", desc: "管理员实时掌握预约趋势和科室热度" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <Icon className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-4 font-heading text-lg font-semibold text-cyan-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">{desc}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-6 font-heading text-2xl font-bold text-cyan-900">科室导航</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              id={dept.id}
              name={dept.name}
              description={dept.description}
              location={dept.location}
              doctorCount={dept._count.doctors}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
