"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, CheckCircle, Users, FileText } from "lucide-react";
import { toast } from "sonner";
import { CurrentPatientRecord } from "./current-patient-record";

type QueuePanelProps = {
  scheduleId: string;
  doctorId: string;
};

type QueueEntry = {
  id: string;
  number: number;
  appointmentId: string | null;
  patientName: string | null;
  status: string;
  calledAt: string | null;
};

type QueueStatus = {
  current: QueueEntry | null;
  nextInLine: QueueEntry | null;
  waitingCount: number;
  completedCount: number;
  queue: QueueEntry[];
};

export function QueuePanel({ scheduleId, doctorId }: QueuePanelProps) {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRecord, setShowRecord] = useState(false);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/queue/${scheduleId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch {
      // polling — silent fail
    }
  }

  async function handleCallNext() {
    setLoading(true);
    try {
      const res = await fetch(`/api/queue/${scheduleId}/call`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setShowRecord(true);
        fetchStatus();
      } else {
        toast.error(data.error ?? "叫号失败");
      }
    } catch {
      toast.error("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [scheduleId]);

  if (!status) return <div>加载中...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-center text-sm text-slate-600">当前叫号</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            {status.current ? (
              <>
                <div className="text-6xl font-bold text-primary animate-pulse">
                  {status.current.number}
                </div>
                {status.current.patientName && (
                  <div className="mt-2 text-lg font-medium text-slate-700">
                    {status.current.patientName}
                  </div>
                )}
              </>
            ) : (
              <div className="text-4xl font-bold text-slate-400">--</div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleCallNext}
          disabled={loading || status.waitingCount === 0}
          className="w-full cursor-pointer"
          size="lg"
        >
          <Phone className="mr-2 h-5 w-5" />
          {loading ? "叫号中..." : "叫下一位"}
        </Button>

        {status.current?.appointmentId && (
          <Button
            onClick={() => setShowRecord(!showRecord)}
            variant="outline"
            className="w-full cursor-pointer"
            size="lg"
          >
            <FileText className="mr-2 h-5 w-5" />
            {showRecord ? "收起病历" : "当前患者病历"}
          </Button>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Users className="h-8 w-8 text-amber-500" />
              <div>
                <div className="text-2xl font-bold">{status.waitingCount}</div>
                <div className="text-xs text-slate-500">等待中</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{status.completedCount}</div>
                <div className="text-xs text-slate-500">已完成</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        {showRecord && status.current?.appointmentId && (
          <CurrentPatientRecord
            appointmentId={status.current.appointmentId}
            doctorId={doctorId}
            patientName={status.current.patientName ?? "未知"}
            onComplete={() => fetchStatus()}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">队列列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {status.queue.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    item.status === "called" ? "border-primary/30 bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold">{item.number}</span>
                    <div>
                      <Badge
                        variant={
                          item.status === "called"
                            ? "default"
                            : item.status === "completed"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {item.status === "waiting" && "等待中"}
                        {item.status === "called" && "就诊中"}
                        {item.status === "completed" && "已完成"}
                        {item.status === "missed" && "过号"}
                      </Badge>
                      {item.patientName && (
                        <span className="ml-2 text-sm text-slate-600">
                          {item.patientName}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.calledAt && (
                    <span className="text-xs text-slate-500">
                      {new Date(item.calledAt).toLocaleTimeString("zh-CN")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
