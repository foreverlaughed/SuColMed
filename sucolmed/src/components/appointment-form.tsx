"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createAppointment } from "@/server/actions/appointment";
import { useSession } from "next-auth/react";
import { CalendarDays, Clock, CheckCircle2, LogIn } from "lucide-react";

type Schedule = {
  id: string;
  date: string;
  timeSlot: string;
  maxPatients: number;
  currentPatients: number;
  status: string;
};

type AppointmentFormProps = {
  doctorId: string;
  doctorName: string;
  schedules: Schedule[];
};

const timeSlotLabels: Record<string, string> = {
  morning: "上午",
  afternoon: "下午",
  evening: "晚间",
};

export function AppointmentForm({ doctorId, schedules }: AppointmentFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ queueNumber: number } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!selectedSchedule || !session?.user?.id) return;

    setLoading(true);
    setError("");

    const res = await createAppointment({
      userId: session.user.id,
      doctorId,
      scheduleId: selectedSchedule.id,
      symptoms: symptoms || undefined,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error);
    } else {
      setResult({ queueNumber: res.data.queueNumber });
    }
  }

  if (!session) {
    return (
      <Card className="border-slate-200">
        <CardContent className="flex flex-col items-center py-12">
          <LogIn className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-slate-700">请先登录</h3>
          <p className="mt-1 text-sm text-slate-500">预约挂号需要登录账户</p>
          <Link href={`/login?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}>
            <Button className="mt-6 cursor-pointer" size="lg">
              前往登录
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex flex-col items-center py-8">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <h3 className="mt-4 font-heading text-xl font-bold text-green-800">预约成功</h3>
          <p className="mt-2 text-green-700">
            您的排队号是：<span className="text-2xl font-bold">{result.queueNumber}</span>
          </p>
          <Button className="mt-6 cursor-pointer" onClick={() => router.push("/appointments")}>
            查看我的预约
          </Button>
        </CardContent>
      </Card>
    );
  }

  const schedulesByDate = schedules.reduce((acc, s) => {
    const date = s.date.split("T")[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(s);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 font-heading text-lg font-semibold text-cyan-900">选择就诊时段</h3>
        <div className="space-y-4">
          {Object.entries(schedulesByDate).map(([date, slots]) => (
            <div key={date}>
              <p className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
                <CalendarDays className="h-4 w-4" />
                {date}
              </p>
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const available = slot.maxPatients - slot.currentPatients;
                  const isSelected = selectedSchedule?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSchedule(slot)}
                      disabled={available <= 0}
                      className={`flex items-center gap-1 rounded-lg border px-4 py-2 text-sm transition-colors duration-200 cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : available > 0
                          ? "border-slate-200 bg-white text-slate-700 hover:border-primary"
                          : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {timeSlotLabels[slot.timeSlot]}
                      <Badge variant={available > 0 ? "secondary" : "destructive"} className="ml-1 text-xs">
                        余{available}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="symptoms">症状描述（选填）</Label>
        <Textarea
          id="symptoms"
          placeholder="请简要描述您的症状，方便医生提前了解..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          className="mt-2"
        />
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <Button
        onClick={handleSubmit}
        disabled={!selectedSchedule || loading}
        className="w-full bg-primary text-white cursor-pointer"
        size="lg"
      >
        {loading ? "提交中..." : "确认预约"}
      </Button>
    </div>
  );
}
