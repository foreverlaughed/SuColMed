"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, FileText, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/doctor/dashboard", label: "今日概览", icon: LayoutDashboard },
  { href: "/doctor/appointments", label: "预约管理", icon: Calendar },
  { href: "/doctor/queue", label: "排队叫号", icon: Users },
  { href: "/doctor/records", label: "病历管理", icon: FileText },
];

export function DoctorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white">
      <div className="p-4">
        <h2 className="font-heading text-lg font-bold text-cyan-900">医生工作台</h2>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-0 w-64 border-t border-slate-200 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </button>
      </div>
    </aside>
  );
}
