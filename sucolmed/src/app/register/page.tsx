"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerUser } from "@/server/actions/auth";
import Link from "next/link";

const roleLabels: Record<string, string> = {
  student: "学生",
  faculty: "教职工",
  external: "校外人员",
};

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("student");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = await registerUser({
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      password: formData.get("password") as string,
      role,
      studentId: (formData.get("studentId") as string) || undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-128px)] items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl text-cyan-900">注册</CardTitle>
          <CardDescription>创建您的预约账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input id="name" name="name" placeholder="请输入姓名" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input id="phone" name="phone" type="tel" placeholder="请输入手机号" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" placeholder="至少6位" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">身份</Label>
              <Select name="role" value={role} onValueChange={(v) => v && setRole(v)}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="选择身份">{roleLabels[role]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">学生</SelectItem>
                  <SelectItem value="faculty">教职工</SelectItem>
                  <SelectItem value="external">校外人员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">学号/工号（选填）</Label>
              <Input id="studentId" name="studentId" placeholder="选填" />
            </div>
            <Button type="submit" className="w-full bg-primary text-white cursor-pointer" disabled={loading}>
              {loading ? "注册中..." : "注册"}
            </Button>
            <p className="text-center text-sm text-slate-500">
              已有账号？{" "}
              <Link href="/login" className="text-primary hover:underline cursor-pointer">
                立即登录
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
