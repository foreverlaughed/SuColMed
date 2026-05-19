"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Search, AlertTriangle } from "lucide-react";
import { MedicineForm } from "@/components/forms/medicine-form";
import { getMedicines, deleteMedicine } from "@/server/actions/medicine";

type Medicine = {
  id: string;
  name: string;
  category: string;
  spec: string;
  unit: string;
  stock: number;
  price: number;
  isActive: boolean;
};

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadMedicines() {
    setLoading(true);
    const result = await getMedicines(undefined, search || undefined);
    if (result.success) {
      setMedicines(result.data as unknown as Medicine[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMedicines();
  }, [search]);

  async function handleDelete(id: string) {
    if (!confirm("确定删除此药品？")) return;
    await deleteMedicine(id);
    loadMedicines();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-cyan-900">药品管理</h1>
        <MedicineForm onSuccess={loadMedicines} />
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="搜索药品名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>药品名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>规格</TableHead>
                <TableHead>单位</TableHead>
                <TableHead className="text-right">库存</TableHead>
                <TableHead className="text-right">单价</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : medicines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500">
                    暂无药品
                  </TableCell>
                </TableRow>
              ) : (
                medicines.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium">{med.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{med.category}</Badge>
                    </TableCell>
                    <TableCell>{med.spec}</TableCell>
                    <TableCell>{med.unit}</TableCell>
                    <TableCell className="text-right">
                      <span className={med.stock < 10 ? "text-red-600 font-bold" : ""}>
                        {med.stock}
                      </span>
                      {med.stock < 10 && (
                        <AlertTriangle className="ml-1 inline h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">¥{med.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <MedicineForm medicine={med} onSuccess={loadMedicines} />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => handleDelete(med.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
