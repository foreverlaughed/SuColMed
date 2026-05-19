"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cancelAppointment } from "@/server/actions/appointment";
import { CalendarDays, Clock, X } from "lucide-react";
import { useState } from "react";

type Appointment = {
  id: string;
  status: string;
  symptoms: string | null;
  queueNumber: number | null;
  createdAt: Date;
  doctor: {
    user: { name: string };
    title: string;
    department: { name: string };
  };
  schedule: {
    date: Date;
    timeSlot: string;
  };
};

const statusLabels: Record<string, string> = {
  pending: "待确认",
  confirmed: "已确认",
  completed: "已完成",
  cancelled: "已取消",
};

const timeSlotLabels: Record<string, string> = {
  morning: "上午",
  afternoon: "下午",
  evening: "晚间",
};

export function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleCancel(id: string) {
    if (!session?.user?.id) return;
    setCancellingId(id);
    const res = await cancelAppointment({ appointmentId: id, userId: session.user.id });
    if (res.success) {
      router.refresh();
    }
    setCancellingId(null);
  }

  if (appointments.length === 0) {
    return <div className="py-12 text-center text-slate-500">暂无预约记录</div>;
  }

  return (
    <div className="space-y-4">
      {appointments.map((apt) => (
        <Card key={apt.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-cyan-900">{apt.doctor.user?.name || "未知医生"}</span>
                <Badge variant={apt.status === "cancelled" ? "destructive" : apt.status === "completed" ? "outline" : apt.status === "confirmed" ? "default" : "secondary"}>
                  {statusLabels[apt.status] || apt.status}
                </Badge>
                {apt.queueNumber && <Badge variant="outline">#{apt.queueNumber}</Badge>}
              </div>
              <p className="text-sm text-slate-500">
                {apt.doctor.department.name} · {apt.doctor.title}
              </p>
              <p className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {new Date(apt.schedule.date).toLocaleDateString("zh-CN")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeSlotLabels[apt.schedule.timeSlot]}
                </span>
              </p>
            </div>
            {(apt.status === "pending" || apt.status === "confirmed") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancel(apt.id)}
                disabled={cancellingId === apt.id}
                className="text-red-500 hover:text-red-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
