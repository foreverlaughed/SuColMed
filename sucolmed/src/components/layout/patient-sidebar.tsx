"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus, Calendar, FileText, Star, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/patient/new-appointment", label: "预约挂号", icon: CalendarPlus },
  { href: "/patient/appointments", label: "我的预约", icon: Calendar },
  { href: "/patient/records", label: "我的病历", icon: FileText },
  { href: "/patient/reviews", label: "我的评价", icon: Star },
];

export function PatientSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white">
      <div className="p-4">
        <h2 className="font-heading text-lg font-bold text-cyan-900">患者中心</h2>
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
