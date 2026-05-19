import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DoctorSidebar } from "@/components/layout/doctor-sidebar";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session.user as any).role;
  if (role !== "doctor") redirect("/");

  return (
    <div className="flex min-h-screen">
      <DoctorSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
