"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      phone: formData.get("phone") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("手机号或密码错误");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-128px)] items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl text-cyan-900">登录</CardTitle>
          <CardDescription>使用手机号和密码登录</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input id="phone" name="phone" type="tel" placeholder="请输入手机号" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" placeholder="请输入密码" required />
            </div>
            <Button type="submit" className="w-full bg-primary text-white cursor-pointer" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
            <p className="text-center text-sm text-slate-500">
              还没有账号？{" "}
              <Link href="/register" className="text-primary hover:underline cursor-pointer">
                立即注册
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
