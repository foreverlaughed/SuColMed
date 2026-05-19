"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Clock } from "lucide-react";

type TodayPanelProps = {
  doctorId: string;
  schedules: {
    id: string;
    date: string;
    timeSlot: string;
    currentPatients: number;
    maxPatients: number;
    status: string;
  }[];
  pendingAppointments: number;
};

const timeSlotLabels: Record<string, string> = {
  morning: "上午",
  afternoon: "下午",
  evening: "晚间",
};

export function TodayPanel({ schedules, pendingAppointments }: TodayPanelProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todaySchedules = schedules.filter((s) => {
    return format(s.date, "yyyy-MM-dd") === todayStr;
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">今日排班</CardTitle>
          <Calendar className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todaySchedules.length}</div>
          <p className="text-xs text-slate-500">个时段</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">待诊患者</CardTitle>
          <Users className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingAppointments}</div>
          <p className="text-xs text-slate-500">位等待</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">当前时段</CardTitle>
          <Clock className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {todaySchedules.length > 0
              ? timeSlotLabels[todaySchedules[0].timeSlot]
              : "无"}
          </div>
          <p className="text-xs text-slate-500">
            {todaySchedules.length > 0
              ? `${todaySchedules[0].currentPatients}/${todaySchedules[0].maxPatients} 已诊`
              : "今日无排班"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
