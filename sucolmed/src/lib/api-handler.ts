import { NextRequest, NextResponse } from "next/server";
import { AppError } from "./error";

type RouteHandler = (
  req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof AppError) {
        console.error(`[API:${req.method}]`, error.code, error.message);
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: error.statusCode }
        );
      }
      console.error(`[API:${req.method}] Unhandled error:`, error);
      return NextResponse.json(
        { success: false, error: "服务器内部错误", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  };
}
