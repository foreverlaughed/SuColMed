"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, Building2 } from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "数据看板", icon: LayoutDashboard },
  { href: "/admin/schedules", label: "排班管理", icon: Calendar },
  { href: "/admin/doctors", label: "医生管理", icon: Users },
  { href: "/admin/departments", label: "科室管理", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white">
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
