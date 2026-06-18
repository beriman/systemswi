// GET /api/agent/event-pipeline — Analyze event pipeline and return report
// POST /api/agent/event-pipeline — Analyze + send report via Telegram
import { NextRequest, NextResponse } from "next/server";
import { runEventPipelineAnalysis, formatEventPipelineForTelegram } from "@/lib/agent/event-pipeline";
import { sendTelegramMessage, isTelegramConfigured } from "@/lib/agent";
import { logAgentActionSafe } from "@/lib/agent/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await runEventPipelineAnalysis();
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: "Event pipeline analysis failed", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const report = await runEventPipelineAnalysis();
    let telegramSent = false;

    if (isTelegramConfigured()) {
      const text = formatEventPipelineForTelegram(report);
      await sendTelegramMessage(text);
      telegramSent = true;
    }

    await logAgentActionSafe({
      timestamp: report.timestamp,
      agent: "HemuHemu/OWL",
      action: "Event Pipeline Update",
      target: "Event_Tenants + Event_Sponsors + Customer_Interactions",
      status: "success",
      humanApproved: "n/a",
      notes: `Tenants: ${report.tenants.total}, Sponsors: ${report.sponsors.total}, Interactions: ${report.interactions.total}, Suggestions: ${report.suggestions.length}`,
    });

    return NextResponse.json({
      ...report,
      telegramSent,
      telegramConfigured: isTelegramConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Event pipeline analysis failed", details: String(error) },
      { status: 500 }
    );
  }
}
