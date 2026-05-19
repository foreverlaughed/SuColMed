"use client";

import { useState, useEffect } from "react";
import { CurrentPatientRecord } from "./current-patient-record";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

type RecordsViewProps = {
  scheduleId: string;
  doctorId: string;
};

export function RecordsView({ scheduleId, doctorId }: RecordsViewProps) {
  const [current, setCurrent] = useState<{
    appointmentId: string;
    patientName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCurrent() {
      try {
        const res = await fetch(`/api/queue/${scheduleId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success && data.data.current?.appointmentId) {
          setCurrent({
            appointmentId: data.data.current.appointmentId,
            patientName: data.data.current.patientName ?? "未知",
          });
        }
      } catch {
        // polling — silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchCurrent();
    const interval = setInterval(fetchCurrent, 5000);
    return () => clearInterval(interval);
  }, [scheduleId]);

  if (loading) return <div className="text-sm text-slate-500">加载中...</div>;

  if (!current) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">当前无就诊患者</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <CurrentPatientRecord
      appointmentId={current.appointmentId}
      doctorId={doctorId}
      patientName={current.patientName}
      onComplete={() => {
        setCurrent(null);
      }}
    />
  );
}
