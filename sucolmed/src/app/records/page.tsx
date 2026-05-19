import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMedicalRecords } from "@/server/actions/medical-record";
import { MedicalRecordCard } from "@/components/medical-record-card";

export default async function RecordsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const records = await getMedicalRecords(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 font-heading text-3xl font-bold text-cyan-900">我的病历</h1>
      {records.length === 0 ? (
        <div className="py-12 text-center text-slate-500">暂无病历记录</div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <MedicalRecordCard
              key={record.id}
              diagnosis={record.diagnosis}
              notes={record.notes}
              followUpDate={record.followUpDate}
              createdAt={record.createdAt}
              doctorName={record.doctor.user.name}
              doctorTitle={record.doctor.title}
              prescription={record.items as any} // eslint-disable-line @typescript-eslint/no-explicit-any
            />
          ))}
        </div>
      )}
    </div>
  );
}
