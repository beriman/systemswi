// GET /api/agent/weekly-report — Generate weekly agent report
// Returns summary of: tasks run, failures, approvals, time saved
// Auto-generated every Monday
import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyReport, runWeeklyReport } from "@/lib/agent/weekly-report";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sendTelegram = searchParams.get("send") === "true";

  try {
    if (sendTelegram) {
      // Generate report and send via Telegram
      const report = await runWeeklyReport();
      return NextResponse.json({ ok: true, report, sent: true });
    } else {
      // Just generate and return report
      const report = await generateWeeklyReport();
      return NextResponse.json({ ok: true, report, sent: false });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Weekly Report API] Error:", errorMessage);
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
