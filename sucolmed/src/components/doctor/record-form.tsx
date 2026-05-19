"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createMedicalRecord } from "@/server/actions/medical-record";
import { Plus, Trash2, Save } from "lucide-react";

type PrescriptionItem = {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
};

type RecordFormProps = {
  appointmentId: string;
  doctorId: string;
  onSuccess?: () => void;
};

export function RecordForm({ appointmentId, doctorId, onSuccess }: RecordFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);

  function addPrescriptionItem() {
    setPrescription([
      ...prescription,
      { medicineName: "", dosage: "", frequency: "", duration: "", notes: "" },
    ]);
  }

  function removePrescriptionItem(index: number) {
    setPrescription(prescription.filter((_, i) => i !== index));
  }

  function updatePrescriptionItem(index: number, field: keyof PrescriptionItem, value: string) {
    const updated = [...prescription];
    updated[index] = { ...updated[index], [field]: value };
    setPrescription(updated);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const validPrescription = prescription.filter(
      (p) => p.medicineName && p.dosage && p.frequency && p.duration
    );

    const result = await createMedicalRecord({
      appointmentId,
      doctorId,
      diagnosis,
      prescription: validPrescription.length > 0 ? validPrescription : undefined,
      notes: notes || undefined,
      followUpDate: followUpDate || undefined,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      onSuccess?.();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="diagnosis">诊断结果 *</Label>
        <Textarea
          id="diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="请输入诊断结果..."
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>处方</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPrescriptionItem}
            className="cursor-pointer"
          >
            <Plus className="mr-1 h-4 w-4" />
            添加药品
          </Button>
        </div>

        {prescription.length > 0 && (
          <div className="space-y-3">
            {prescription.map((item, index) => (
              <Card key={index}>
                <CardContent className="grid grid-cols-2 gap-3 pt-4">
                  <div>
                    <Label>药品名称</Label>
                    <Input
                      value={item.medicineName}
                      onChange={(e) => updatePrescriptionItem(index, "medicineName", e.target.value)}
                      placeholder="药品名"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>剂量</Label>
                    <Input
                      value={item.dosage}
                      onChange={(e) => updatePrescriptionItem(index, "dosage", e.target.value)}
                      placeholder="如：0.25g"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>频率</Label>
                    <Input
                      value={item.frequency}
                      onChange={(e) => updatePrescriptionItem(index, "frequency", e.target.value)}
                      placeholder="如：每日3次"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>疗程</Label>
                    <Input
                      value={item.duration}
                      onChange={(e) => updatePrescriptionItem(index, "duration", e.target.value)}
                      placeholder="如：7天"
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2 flex items-end gap-2">
                    <div className="flex-1">
                      <Label>备注</Label>
                      <Input
                        value={item.notes}
                        onChange={(e) => updatePrescriptionItem(index, "notes", e.target.value)}
                        placeholder="选填"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removePrescriptionItem(index)}
                      className="cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="notes">备注</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="其他备注信息..."
          className="mt-1"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="followUpDate">复诊日期（选填）</Label>
        <Input
          id="followUpDate"
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
          className="mt-1"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading || !diagnosis}
        className="w-full cursor-pointer"
        size="lg"
      >
        <Save className="mr-2 h-5 w-5" />
        {loading ? "保存中..." : "保存病历"}
      </Button>
    </div>
  );
}
