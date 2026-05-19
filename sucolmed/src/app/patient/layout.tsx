import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PatientSidebar } from "@/components/layout/patient-sidebar";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <PatientSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
