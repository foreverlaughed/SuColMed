"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createDoctor, updateDoctor } from "@/server/actions/doctor";
import { getDepartments } from "@/server/actions/department";
import { Plus, Pencil } from "lucide-react";

type Doctor = {
  id: string;
  userId: string;
  departmentId: string;
  title: string;
  specialties?: string[] | null;
  bio?: string | null;
};

type DoctorFormProps = {
  doctor?: Doctor;
  onSuccess?: () => void;
};

export function DoctorForm({ doctor, onSuccess }: DoctorFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState(doctor?.departmentId ?? "");
  const [title, setTitle] = useState(doctor?.title ?? "");
  const [specialties, setSpecialties] = useState(doctor?.specialties?.join(", ") ?? "");
  const [bio, setBio] = useState(doctor?.bio ?? "");

  const isEditing = !!doctor;

  const loadDepartments = useCallback(() => {
    getDepartments().then((res) => {
      setDepartments(res);
    });
  }, []);

  useEffect(() => {
    if (open) {
      loadDepartments();
      if (!isEditing) {
        setName("");
        setPhone("");
        setPassword("");
        setDepartmentId("");
        setTitle("");
        setSpecialties("");
        setBio("");
      }
    }
  }, [open, isEditing, loadDepartments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const specialtiesArray = specialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const result = isEditing
      ? await updateDoctor(doctor.id, {
          departmentId,
          title,
          specialties: specialtiesArray,
          bio,
        })
      : await createDoctor({
          name,
          phone,
          password,
          departmentId,
          title,
          specialties: specialtiesArray,
          bio,
        });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setOpen(false);
      onSuccess?.();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="cursor-pointer" size={isEditing ? "sm" : "default"}>
          {isEditing ? (
            <>
              <Pencil className="mr-1 h-4 w-4" />
              编辑
            </>
          ) : (
            <>
              <Plus className="mr-1 h-4 w-4" />
              新增医生账号
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? "编辑医生" : "新增医生账号"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isEditing && (
            <>
              <div>
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入医生姓名"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">手机号 *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="11位手机号"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">密码 *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6位密码"
                  className="mt-1"
                  required
                />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="departmentId">所属科室 *</Label>
            <select
              id="departmentId"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="mt-1 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              required
            >
              <option value="" disabled>选择科室</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="title">职称 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：主任医师"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="specialties">专长（逗号分隔）</Label>
            <Input
              id="specialties"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="如：心血管, 高血压"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="bio">简介</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="医生简介..."
              className="mt-1"
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
          <Button type="submit" disabled={loading} className="w-full cursor-pointer">
            {loading ? "保存中..." : "保存"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
