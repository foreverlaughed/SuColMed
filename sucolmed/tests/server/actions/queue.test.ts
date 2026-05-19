import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    queueNumber: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    schedule: {
      findUnique: vi.fn(),
    },
  },
}));

import { createQueueNumber, callNextNumber, getQueueStatus } from "@/server/actions/queue";
import { prisma } from "@/lib/prisma";

describe("createQueueNumber", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fail if schedule not found", async () => {
    vi.mocked(prisma.schedule.findUnique).mockResolvedValue(null);

    const result = await createQueueNumber("550e8400-e29b-41d4-a716-446655440001");

    expect(result.success).toBe(false);
    expect(result.error).toContain("排班不存在");
  });

  it("should create queue number successfully", async () => {
    const mockSchedule = { id: "550e8400-e29b-41d4-a716-446655440001", currentPatients: 5 };
    const mockQueue = { id: "550e8400-e29b-41d4-a716-446655440002", number: 6, status: "waiting" };

    vi.mocked(prisma.schedule.findUnique).mockResolvedValue(mockSchedule as any);
    vi.mocked(prisma.queueNumber.count).mockResolvedValue(5);
    vi.mocked(prisma.queueNumber.create).mockResolvedValue(mockQueue as any);

    const result = await createQueueNumber("550e8400-e29b-41d4-a716-446655440001");

    expect(result.success).toBe(true);
    expect(result.data?.number).toBe(6);
  });
});

describe("callNextNumber", () => {
  it("should fail if no waiting patients", async () => {
    vi.mocked(prisma.queueNumber.findFirst).mockResolvedValue(null);

    const result = await callNextNumber("550e8400-e29b-41d4-a716-446655440001");

    expect(result.success).toBe(false);
    expect(result.error).toContain("没有等待中的患者");
  });

  it("should call next patient successfully", async () => {
    const mockNext = { id: "550e8400-e29b-41d4-a716-446655440002", number: 3, status: "waiting" };
    const mockUpdated = { ...mockNext, status: "called", calledAt: new Date() };

    vi.mocked(prisma.queueNumber.findFirst).mockResolvedValue(mockNext as any);
    vi.mocked(prisma.queueNumber.update).mockResolvedValue(mockUpdated as any);

    const result = await callNextNumber("550e8400-e29b-41d4-a716-446655440001");

    expect(result.success).toBe(true);
    expect(result.data?.number).toBe(3);
  });
});

describe("getQueueStatus", () => {
  it("should return queue status", async () => {
    const mockQueue = [
      { id: "1", number: 1, status: "completed", calledAt: new Date(), createdAt: new Date() },
      { id: "2", number: 2, status: "called", calledAt: new Date(), createdAt: new Date() },
      { id: "3", number: 3, status: "waiting", calledAt: null, createdAt: new Date() },
    ];

    vi.mocked(prisma.queueNumber.findMany).mockResolvedValue(mockQueue as any);

    const result = await getQueueStatus("550e8400-e29b-41d4-a716-446655440001");

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
