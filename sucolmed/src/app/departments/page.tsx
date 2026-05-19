import { DepartmentCard } from "@/components/department-card";
import { getDepartments } from "@/server/actions/department";

export default async function DepartmentsPage() {
  const departments = await getDepartments();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-8 font-heading text-3xl font-bold text-cyan-900">科室导航</h1>
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
    </div>
  );
}
