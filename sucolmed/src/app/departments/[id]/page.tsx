import { notFound } from "next/navigation";
import { getDepartmentById } from "@/server/actions/department";
import { DoctorCard } from "@/components/doctor-card";
import { MapPin } from "lucide-react";

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const department = await getDepartmentById(id);

  if (!department) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-cyan-900">{department.name}</h1>
        {department.location && (
          <p className="mt-2 flex items-center gap-1 text-slate-600">
            <MapPin className="h-4 w-4" />
            {department.location}
          </p>
        )}
        {department.description && (
          <p className="mt-4 text-slate-600">{department.description}</p>
        )}
      </div>

      <h2 className="mb-4 font-heading text-xl font-semibold text-cyan-900">医生列表</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {department.doctors.map((doc) => (
          <DoctorCard
            key={doc.id}
            id={doc.id}
            name={doc.user.name}
            title={doc.title}
            specialties={doc.specialties as string[] | null}
            departmentName={department.name}
          />
        ))}
      </div>
    </div>
  );
}
