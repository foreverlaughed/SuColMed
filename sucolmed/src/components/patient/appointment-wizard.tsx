"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, ChevronLeft } from "lucide-react";
import { getDepartments } from "@/server/actions/department";
import { getDoctors } from "@/server/actions/doctor";
import { createAppointment } from "@/server/actions/appointment";
import { useSession } from "next-auth/react";

type Department = { id: string; name: string; description?: string | null };
type Doctor = {
  id: string;
  user: { name: string };
  department: { name: string };
  title: string;
};
type Schedule = {
  id: string;
  date: string;
  timeSlot: string;
  maxPatients: number;
  currentPatients: number;
  status: string;
};

const timeSlotLabels: Record<string, string> = {
  morning: "上午",
  afternoon: "下午",
  evening: "晚间",
};

export function AppointmentWizard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [symptoms, setSymptoms] = useState("");

  useEffect(() => {
    getDepartments().then((res) => {
      setDepartments(res);
    });
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      getDoctors(selectedDepartment.id).then((res) => {
        setDoctors(res);
      });
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedDoctor) {
      fetch(`/api/schedules?doctorId=${selectedDoctor.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setSchedules(data.data);
        });
    }
  }, [selectedDoctor]);

  async function handleSubmit() {
    if (!selectedSchedule || !selectedDoctor || !session?.user?.id) return;

    setLoading(true);
    setError("");

    const result = await createAppointment({
      userId: session.user.id,
      doctorId: selectedDoctor.id,
      scheduleId: selectedSchedule.id,
      symptoms: symptoms || undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setStep(4);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {step > s ? <CheckCircle className="h-4 w-4" /> : s}
            </div>
            {s < 3 && <div className={`h-0.5 w-12 ${step > s ? "bg-primary" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>选择科室</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => {
                    setSelectedDepartment(dept);
                    setStep(2);
                  }}
                  className={`rounded-lg border p-4 text-left transition-colors cursor-pointer ${
                    selectedDepartment?.id === dept.id
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-primary"
                  }`}
                >
                  <div className="font-medium">{dept.name}</div>
                  {dept.description && (
                    <div className="mt-1 text-xs text-slate-500 line-clamp-2">{dept.description}</div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>选择医生 - {selectedDepartment?.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="cursor-pointer">
                <ChevronLeft className="mr-1 h-4 w-4" />
                返回
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {doctors.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setStep(3);
                  }}
                  className={`w-full rounded-lg border p-4 text-left transition-colors cursor-pointer ${
                    selectedDoctor?.id === doc.id
                      ? "border-primary bg-primary/5"
                      : "border-slate-200 hover:border-primary"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{doc.user.name}</div>
                      <div className="text-xs text-slate-500">{doc.title}</div>
                    </div>
                    <Badge variant="outline">{doc.department.name}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>选择时间 - {selectedDoctor?.user.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="cursor-pointer">
                <ChevronLeft className="mr-1 h-4 w-4" />
                返回
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>症状描述（选填）</Label>
              <Textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="请简要描述您的症状..."
                className="mt-1"
              />
            </div>

            <div className="space-y-3">
              {schedules.map((schedule) => {
                const available = schedule.maxPatients - schedule.currentPatients;
                return (
                  <button
                    key={schedule.id}
                    onClick={() => setSelectedSchedule(schedule)}
                    disabled={available <= 0}
                    className={`w-full rounded-lg border p-4 text-left transition-colors cursor-pointer ${
                      selectedSchedule?.id === schedule.id
                        ? "border-primary bg-primary/5"
                        : available > 0
                        ? "border-slate-200 hover:border-primary"
                        : "cursor-not-allowed border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {new Date(schedule.date).toLocaleDateString("zh-CN")}{" "}
                        {timeSlotLabels[schedule.timeSlot]}
                      </span>
                      <Badge variant={available > 0 ? "secondary" : "destructive"}>
                        余{available}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!selectedSchedule || loading}
              className="w-full cursor-pointer"
              size="lg"
            >
              {loading ? "提交中..." : "确认预约"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="mt-4 font-heading text-xl font-bold text-green-800">预约成功</h3>
            <p className="mt-2 text-green-700">请按时就诊</p>
            <Button className="mt-6 cursor-pointer" onClick={() => router.push("/patient/appointments")}>
              查看我的预约
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
