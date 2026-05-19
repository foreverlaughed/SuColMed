"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createSchedule } from "@/server/actions/schedule";
import { Plus } from "lucide-react";

type ScheduleFormProps = {
  doctors: { id: string; user: { name: string }; department: { name: string } }[];
  onSuccess?: () => void;
};

export function ScheduleForm({ doctors, onSuccess }: ScheduleFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [maxPatients, setMaxPatients] = useState("20");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createSchedule({
      doctorId,
      date,
      timeSlot,
      maxPatients: parseInt(maxPatients, 10),
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
        <Button className="cursor-pointer">
          <Plus className="mr-1 h-4 w-4" />
          新增排班
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>新增排班</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="doctorId">选择医生 *</Label>
            <select
              id="doctorId"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="mt-1 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              required
            >
              <option value="" disabled>选择医生</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.user.name} - {doc.department.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="date">日期 *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="timeSlot">时段 *</Label>
            <select
              id="timeSlot"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="mt-1 flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              required
            >
              <option value="" disabled>选择时段</option>
              <option value="morning">上午</option>
              <option value="afternoon">下午</option>
              <option value="evening">晚间</option>
            </select>
          </div>
          <div>
            <Label htmlFor="maxPatients">最大接诊数 *</Label>
            <Input
              id="maxPatients"
              type="number"
              min="1"
              max="100"
              value={maxPatients}
              onChange={(e) => setMaxPatients(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
          <Button type="submit" disabled={loading} className="w-full cursor-pointer">
            {loading ? "创建中..." : "创建排班"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
