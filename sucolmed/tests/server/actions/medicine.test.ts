import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    medicine: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { createMedicine, getMedicines, reduceStock } from "@/server/actions/medicine";
import { prisma } from "@/lib/prisma";

describe("createMedicine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fail with empty name", async () => {
    const result = await createMedicine({
      name: "",
      category: "抗生素",
      spec: "0.25g*12片",
      unit: "盒",
      stock: 100,
      price: 25.5,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("药品名称");
  });

  it("should create medicine successfully", async () => {
    const mockMedicine = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "阿莫西林",
      category: "抗生素",
      stock: 100,
    };

    vi.mocked(prisma.medicine.create).mockResolvedValue(mockMedicine as any);

    const result = await createMedicine({
      name: "阿莫西林",
      category: "抗生素",
      spec: "0.25g*12片",
      unit: "盒",
      stock: 100,
      price: 25.5,
    });

    expect(result.success).toBe(true);
  });
});

describe("reduceStock", () => {
  it("should fail if insufficient stock", async () => {
    const mockMedicine = { id: "550e8400-e29b-41d4-a716-446655440001", stock: 5 };

    vi.mocked(prisma.medicine.findUnique).mockResolvedValue(mockMedicine as any);

    const result = await reduceStock("550e8400-e29b-41d4-a716-446655440001", 10);

    expect(result.success).toBe(false);
    expect(result.error).toContain("库存不足");
  });

  it("should reduce stock successfully", async () => {
    const mockMedicine = { id: "550e8400-e29b-41d4-a716-446655440001", stock: 100 };

    vi.mocked(prisma.medicine.findUnique).mockResolvedValue(mockMedicine as any);
    vi.mocked(prisma.medicine.update).mockResolvedValue({ id: "550e8400-e29b-41d4-a716-446655440001", stock: 95 } as any);

    const result = await reduceStock("550e8400-e29b-41d4-a716-446655440001", 5);

    expect(result.success).toBe(true);
  });
});
