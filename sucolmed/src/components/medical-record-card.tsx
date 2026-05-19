"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill } from "lucide-react";

type MedicalRecordCardProps = {
  diagnosis: string;
  notes: string | null;
  followUpDate: Date | null;
  createdAt: Date;
  doctorName: string;
  doctorTitle: string;
  prescription: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string | null;
  }[];
};

export function MedicalRecordCard({
  diagnosis,
  notes,
  followUpDate,
  createdAt,
  doctorName,
  doctorTitle,
  prescription,
}: MedicalRecordCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="font-heading text-lg text-cyan-900">{diagnosis}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {new Date(createdAt).toLocaleDateString("zh-CN")}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">
          {doctorName} · {doctorTitle}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes && (
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">医嘱</p>
            <p className="text-sm text-slate-700">{notes}</p>
          </div>
        )}
        {followUpDate && (
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">复诊日期</p>
            <p className="text-sm text-slate-700">
              {new Date(followUpDate).toLocaleDateString("zh-CN")}
            </p>
          </div>
        )}
        {prescription.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-500">
              <Pill className="h-3 w-3" />
              处方
            </p>
            <div className="space-y-2">
              {prescription.map((item, i) => (
                <div key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-cyan-900">{item.medicineName}</p>
                  <p className="text-xs text-slate-500">
                    {item.dosage} · {item.frequency} · {item.duration}
                  </p>
                  {item.notes && <p className="mt-1 text-xs text-slate-400">{item.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
