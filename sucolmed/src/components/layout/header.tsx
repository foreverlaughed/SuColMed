"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Building2, LogOut, User } from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isDoctorOrAdmin = pathname.startsWith("/doctor") || pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="font-heading text-xl font-bold text-cyan-900">
            宿院医约
          </span>
        </Link>

        {!isDoctorOrAdmin && (
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/departments"
              className="text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-cyan-900 cursor-pointer"
            >
              科室导航
            </Link>
            {session && (
              <>
                <Link
                  href="/appointments"
                  className="text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-cyan-900 cursor-pointer"
                >
                  我的预约
                </Link>
                <Link
                  href="/records"
                  className="text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-cyan-900 cursor-pointer"
                >
                  我的病历
                </Link>
                {session.user.role === "admin" && (
                  <Link
                    href="/admin/dashboard"
                    className="text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-cyan-900 cursor-pointer"
                  >
                    管理后台
                  </Link>
                )}
              </>
            )}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm text-slate-600">
                <User className="h-4 w-4" />
                {session.user.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-slate-600 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login" className="cursor-pointer">
              <Button variant="default" size="sm" className="bg-primary text-white cursor-pointer">
                登录
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
