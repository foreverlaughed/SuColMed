import { AppointmentWizard } from "@/components/patient/appointment-wizard";

export default function NewAppointmentPage() {
  return (
    <div>
      <h1 className="mb-8 font-heading text-2xl font-bold text-cyan-900">预约挂号</h1>
      <AppointmentWizard />
    </div>
  );
}
