import { notFound } from "next/navigation";
import { getDoctorById } from "@/server/actions/doctor";
import { AppointmentForm } from "@/components/appointment-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Stethoscope } from "lucide-react";

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = await getDoctorById(id);

  if (!doctor) {
    notFound();
  }

  const schedules = doctor.schedules.map((s) => ({
    ...s,
    date: s.date.toISOString(),
  }));

  const specialties = doctor.specialties as string[] | null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-start gap-6">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Stethoscope className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-2xl font-bold text-cyan-900">{doctor.user.name}</h1>
          <p className="text-slate-600">{doctor.title}</p>
          <Badge variant="secondary" className="mt-2">
            {doctor.department.name}
          </Badge>
          {specialties && specialties.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {specialties.map((s) => (
                <Badge key={s} variant="outline" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          )}
          {doctor.bio && <p className="mt-4 text-sm text-slate-600">{doctor.bio}</p>}
        </div>
      </div>

      <AppointmentForm doctorId={doctor.id} doctorName={doctor.user.name} schedules={schedules} />
    </div>
  );
}
