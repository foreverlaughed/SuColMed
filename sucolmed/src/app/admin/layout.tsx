import { Sidebar } from "@/components/layout/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-128px)]">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
