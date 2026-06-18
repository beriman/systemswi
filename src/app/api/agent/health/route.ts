// GET /api/agent/health — Run health check and return report
// POST /api/agent/health — Run health check and send report via Telegram
import { NextRequest, NextResponse } from "next/server";
import { runHealthCheck, sendHealthReport, isTelegramConfigured } from "@/lib/agent";
import { logAgentActionSafe } from "@/lib/agent/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await runHealthCheck();
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: "Health check failed", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const report = await runHealthCheck();
    let telegramResult = null;

    if (isTelegramConfigured()) {
      telegramResult = await sendHealthReport(report);
    }

    // Log the health check action
    await logAgentActionSafe({
      timestamp: report.timestamp,
      agent: "HemuHemu/OWL",
      action: "Daily Health Check",
      target: "All SWI Systems",
      status: report.status === "healthy" ? "success" : "failed",
      humanApproved: "n/a",
      details: `Health: ${report.status}, Checks: ${report.checks.length}, Telegram: ${telegramResult ? "sent" : "not configured"}`,
    });

    return NextResponse.json({
      ...report,
      telegramSent: !!telegramResult,
      telegramConfigured: isTelegramConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Health check failed", details: String(error) },
      { status: 500 }
    );
  }
}
