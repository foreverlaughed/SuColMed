import { NextRequest, NextResponse } from "next/server";
import { callNextNumber } from "@/server/actions/queue";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const { scheduleId } = await params;

  const result = await callNextNumber(scheduleId);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json(result);
}
