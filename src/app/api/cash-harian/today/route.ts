// GET /api/cash-harian/today — Today's cash position
import { NextRequest, NextResponse } from "next/server";
import { getTodayPosition, ensureCashHarianInitialized } from "@/lib/sheets/cash-harian-sheets";
import { isGoogleWorkspaceAuthError, googleWorkspaceDegradedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureCashHarianInitialized();
    const position = await getTodayPosition();

    return NextResponse.json({
      source: "Google Sheets: Cash_Harian",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      data: position,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Cash_Harian", error),
        data: null,
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch today's cash position", details: String(error) },
      { status: 500 }
    );
  }
}
