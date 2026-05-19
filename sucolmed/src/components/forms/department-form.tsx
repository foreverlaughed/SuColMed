"use client";

import { useState } from "react";
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
import { createDepartment, updateDepartment } from "@/server/actions/department";
import { Plus, Pencil } from "lucide-react";

type Department = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  isActive: boolean;
};

type DepartmentFormProps = {
  department?: Department;
  onSuccess?: () => void;
};

export function DepartmentForm({ department, onSuccess }: DepartmentFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(department?.name ?? "");
  const [description, setDescription] = useState(department?.description ?? "");
  const [location, setLocation] = useState(department?.location ?? "");

  const isEditing = !!department;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = isEditing
      ? await updateDepartment(department.id, { name, description, location })
      : await createDepartment({ name, description, location });

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
              新增科室
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? "编辑科室" : "新增科室"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">科室名称 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：内科"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">科室描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="科室简介..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="location">位置</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="如：门诊楼3层"
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
