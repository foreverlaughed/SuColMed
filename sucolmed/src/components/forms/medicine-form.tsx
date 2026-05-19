"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createMedicine, updateMedicine } from "@/server/actions/medicine";
import { Plus, Pencil } from "lucide-react";

type Medicine = {
  id: string;
  name: string;
  category: string;
  spec: string;
  unit: string;
  stock: number;
  price: number;
};

type MedicineFormProps = {
  medicine?: Medicine;
  onSuccess?: () => void;
};

const categories = ["抗生素", "解热镇痛", "消化系统", "心血管", "呼吸系统", "其他"];

export function MedicineForm({ medicine, onSuccess }: MedicineFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(medicine?.name ?? "");
  const [category, setCategory] = useState(medicine?.category ?? "");
  const [spec, setSpec] = useState(medicine?.spec ?? "");
  const [unit, setUnit] = useState(medicine?.unit ?? "");
  const [stock, setStock] = useState(String(medicine?.stock ?? 0));
  const [price, setPrice] = useState(String(medicine?.price ?? 0));

  const isEditing = !!medicine;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = isEditing
      ? await updateMedicine(medicine.id, {
          name,
          category,
          spec,
          unit,
          stock: parseInt(stock, 10),
          price: parseFloat(price),
        })
      : await createMedicine({
          name,
          category,
          spec,
          unit,
          stock: parseInt(stock, 10),
          price: parseFloat(price),
        });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      setOpen(false);
      onSuccess?.();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="cursor-pointer" size={isEditing ? "sm" : "default"}>
          {isEditing ? (
            <>
              <Pencil className="mr-1 h-4 w-4" />
              编辑
            </>
          ) : (
            <>
              <Plus className="mr-1 h-4 w-4" />
              新增药品
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? "编辑药品" : "新增药品"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">药品名称 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：阿莫西林胶囊"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="category">分类 *</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value ?? "")}
            >
              <SelectTrigger className="mt-1 cursor-pointer">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="spec">规格 *</Label>
            <Input
              id="spec"
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              placeholder="如：0.25g*12片/盒"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="unit">单位 *</Label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="如：盒、瓶"
              className="mt-1"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock">库存 *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="price">单价 (元) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
          <Button type="submit" disabled={loading} className="w-full cursor-pointer">
            {loading ? "保存中..." : "保存"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
