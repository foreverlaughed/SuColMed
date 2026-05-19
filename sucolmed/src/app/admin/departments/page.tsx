import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Trash2 } from "lucide-react";
import { DepartmentForm } from "@/components/forms/department-form";
import { deleteDepartment } from "@/server/actions/department";
import { revalidatePath } from "next/cache";

export default async function DepartmentsManagementPage() {
  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { doctors: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await deleteDepartment(id);
    revalidatePath("/admin/departments");
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-cyan-900">科室管理</h1>
        <DepartmentForm />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{dept.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={dept.isActive ? "default" : "destructive"}>
                    {dept.isActive ? "启用" : "停用"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {dept.description && (
                <p className="text-xs text-slate-500 line-clamp-2">{dept.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                {dept.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {dept.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {dept._count.doctors} 位医生
                </span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <DepartmentForm department={dept} />
                <form action={handleDelete}>
                  <input type="hidden" name="id" value={dept.id} />
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    disabled={dept._count.doctors > 0}
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
