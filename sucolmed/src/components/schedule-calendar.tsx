"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const timeSlotLabels: Record<string, string> = {
  morning: "上午",
  afternoon: "下午",
  evening: "晚间",
};

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  full: "bg-amber-100 text-amber-800",
  closed: "bg-slate-100 text-slate-500",
};

const statusLabels: Record<string, string> = {
  open: "开放",
  full: "已满",
  closed: "已关闭",
};

type Doctor = {
  id: string;
  user: { name: string };
  department: { name: string };
  schedules: {
    id: string;
    date: Date;
    timeSlot: string;
    maxPatients: number;
    currentPatients: number;
    status: string;
  }[];
};

export function ScheduleCalendar({ doctors }: { doctors: Doctor[] }) {
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");

  const filtered =
    selectedDoctor === "all"
      ? doctors
      : doctors.filter((d) => d.id === selectedDoctor);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedDoctor} onValueChange={(v) => v && setSelectedDoctor(v)}>
          <SelectTrigger className="w-64 cursor-pointer">
            <SelectValue placeholder="选择医生" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部医生</SelectItem>
            {doctors.map((doc) => (
              <SelectItem key={doc.id} value={doc.id}>
                {doc.user.name} - {doc.department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((doc) => (
          <Card key={doc.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {doc.user.name}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  {doc.department.name}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {doc.schedules.length === 0 ? (
                <p className="text-xs text-slate-400">暂无排班</p>
              ) : (
                <div className="space-y-1">
                  {doc.schedules.slice(0, 10).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-600">
                        {new Date(s.date).toLocaleDateString("zh-CN")}{" "}
                        {timeSlotLabels[s.timeSlot]}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-400">
                          {s.currentPatients}/{s.maxPatients}
                        </span>
                        <Badge
                          className={`text-xs ${statusColors[s.status] || ""}`}
                          variant="outline"
                        >
                          {statusLabels[s.status] || s.status}
                        </Badge>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
