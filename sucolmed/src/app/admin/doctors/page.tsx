import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope, Trash2 } from "lucide-react";
import { DoctorForm } from "@/components/forms/doctor-form";
import { deleteDoctor } from "@/server/actions/doctor";
import { revalidatePath } from "next/cache";

export default async function DoctorsManagementPage() {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: { select: { name: true, phone: true } },
      department: { select: { name: true } },
      _count: { select: { schedules: true, appointments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await deleteDoctor(id);
    revalidatePath("/admin/doctors");
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-cyan-900">医生管理</h1>
        <DoctorForm />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doc) => (
          <Card key={doc.id}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">{doc.user.name}</CardTitle>
                <p className="text-xs text-slate-500">{doc.user.phone}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{doc.title}</Badge>
                <Badge variant="outline">{doc.department.name}</Badge>
              </div>
              <p className="text-xs text-slate-400">
                排班 {doc._count.schedules} · 预约 {doc._count.appointments}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <DoctorForm
                  doctor={{
                    id: doc.id,
                    userId: doc.userId,
                    departmentId: doc.departmentId,
                    title: doc.title,
                    specialties: doc.specialties as string[] | null,
                    bio: doc.bio,
                  }}
                />
                <form action={handleDelete}>
                  <input type="hidden" name="id" value={doc.id} />
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    disabled={doc._count.appointments > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
