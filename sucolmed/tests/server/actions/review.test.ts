import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    review: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      aggregate: vi.fn(),
    },
    appointment: {
      findUnique: vi.fn(),
    },
  },
}));

import { createReview, getDoctorReviews } from "@/server/actions/review";
import { prisma } from "@/lib/prisma";

describe("createReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fail with invalid rating", async () => {
    const result = await createReview({
      appointmentId: "550e8400-e29b-41d4-a716-446655440001",
      patientId: "550e8400-e29b-41d4-a716-446655440002",
      doctorId: "550e8400-e29b-41d4-a716-446655440003",
      rating: 6,
      comment: "好医生",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should fail if appointment not found", async () => {
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(null);

    const result = await createReview({
      appointmentId: "550e8400-e29b-41d4-a716-446655440001",
      patientId: "550e8400-e29b-41d4-a716-446655440002",
      doctorId: "550e8400-e29b-41d4-a716-446655440003",
      rating: 5,
      comment: "好医生",
    });

    expect(result.success).toBe(false);
  });

  it("should create review successfully", async () => {
    const mockAppointment = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      userId: "550e8400-e29b-41d4-a716-446655440002",
      doctorId: "550e8400-e29b-41d4-a716-446655440003",
      status: "completed",
    };
    const mockReview = {
      id: "550e8400-e29b-41d4-a716-446655440004",
      appointmentId: "550e8400-e29b-41d4-a716-446655440001",
      rating: 5,
      comment: "好医生",
    };

    vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce(mockAppointment as any);
    vi.mocked(prisma.review.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.review.create).mockResolvedValueOnce(mockReview as any);

    const result = await createReview({
      appointmentId: "550e8400-e29b-41d4-a716-446655440001",
      patientId: "550e8400-e29b-41d4-a716-446655440002",
      doctorId: "550e8400-e29b-41d4-a716-446655440003",
      rating: 5,
      comment: "好医生",
    });

    expect(result.success).toBe(true);
  });
});

describe("getDoctorReviews", () => {
  it("should return reviews with average rating", async () => {
    const mockReviews = [
      { id: "1", rating: 5, comment: "很好", createdAt: new Date(), patient: { name: "患者1" } },
      { id: "2", rating: 4, comment: "不错", createdAt: new Date(), patient: { name: "患者2" } },
    ];

    vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews as any);
    vi.mocked(prisma.review.aggregate).mockResolvedValue({
      _avg: { rating: 4.5 },
      _count: { rating: 2 },
    } as any);

    const result = await getDoctorReviews("test-doctor-id");

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
