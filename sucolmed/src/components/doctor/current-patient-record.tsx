"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";
import { createMedicalRecord, updateMedicalRecord } from "@/server/actions/medical-record";

type CurrentPatientRecordProps = {
  appointmentId: string;
  doctorId: string;
  patientName: string;
  onComplete: () => void;
};

type PrescriptionItem = {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
};

export function CurrentPatientRecord({
  appointmentId,
  doctorId,
  patientName,
  onComplete,
}: CurrentPatientRecordProps) {
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecord() {
      const mod = await import("@/server/actions/medical-record");
      const record = await mod.getMedicalRecordByAppointment(appointmentId);
      if (record) {
        setDiagnosis(record.diagnosis);
        setNotes(record.notes ?? "");
        setPrescription(
          record.items.map((i) => ({
            medicineName: i.medicineName,
            dosage: i.dosage,
            frequency: i.frequency,
            duration: i.duration,
            notes: i.notes ?? undefined,
          })),
        );
      }
    }
    loadRecord();
  }, [appointmentId]);

  function addPrescriptionItem() {
    setPrescription([
      ...prescription,
      { medicineName: "", dosage: "", frequency: "", duration: "" },
    ]);
  }

  function updatePrescriptionItem(index: number, field: keyof PrescriptionItem, value: string) {
    const updated = [...prescription];
    updated[index] = { ...updated[index], [field]: value };
    setPrescription(updated);
  }

  function removePrescriptionItem(index: number) {
    setPrescription(prescription.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!diagnosis.trim()) {
      setError("请输入诊断结果");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const existing = await (
        await import("@/server/actions/medical-record")
      ).getMedicalRecordByAppointment(appointmentId);

      if (existing) {
        const res = await updateMedicalRecord({
          recordId: existing.id,
          doctorId,
          diagnosis,
          prescription: prescription.filter((p) => p.medicineName),
          notes: notes || undefined,
        });
        if (!res.success) {
          setError(res.error);
        }
      } else {
        const res = await createMedicalRecord({
          appointmentId,
          doctorId,
          diagnosis,
          prescription: prescription.filter((p) => p.medicineName),
          notes: notes || undefined,
        });
        if (!res.success) {
          setError(res.error);
        }
      }

      onComplete();
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-blue-700">
          当前患者病历 — {patientName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>诊断结果</Label>
          <Textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="输入诊断结果..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>处方</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPrescriptionItem}
              className="cursor-pointer"
            >
              <Plus className="mr-1 h-3 w-3" />
              添加药品
            </Button>
          </div>
          {prescription.map((item, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border p-2">
              <div className="flex-1">
                <Label className="text-xs">药品</Label>
                <Input
                  value={item.medicineName}
                  onChange={(e) => updatePrescriptionItem(i, "medicineName", e.target.value)}
                  placeholder="药品名"
                />
              </div>
              <div className="w-20">
                <Label className="text-xs">用量</Label>
                <Input
                  value={item.dosage}
                  onChange={(e) => updatePrescriptionItem(i, "dosage", e.target.value)}
                  placeholder="如 1片"
                />
              </div>
              <div className="w-24">
                <Label className="text-xs">频次</Label>
                <Input
                  value={item.frequency}
                  onChange={(e) => updatePrescriptionItem(i, "frequency", e.target.value)}
                  placeholder="如 每日3次"
                />
              </div>
              <div className="w-20">
                <Label className="text-xs">疗程</Label>
                <Input
                  value={item.duration}
                  onChange={(e) => updatePrescriptionItem(i, "duration", e.target.value)}
                  placeholder="如 7天"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePrescriptionItem(i)}
                className="cursor-pointer"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label>备注</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="其他备注..."
            rows={2}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full cursor-pointer"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "保存中..." : "保存病历"}
        </Button>
      </CardContent>
    </Card>
  );
}
