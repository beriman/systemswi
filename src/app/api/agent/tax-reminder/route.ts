// Agent Tax Reminder API
// GET /api/agent/tax-reminder — Check tax calendar for H-3 reminders
import { NextRequest, NextResponse } from "next/server";
import { runTaxReminderCheck } from "@/lib/agent/tax-reminder";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dryRun") === "true";

    if (dryRun) {
      // Dry run: return report without sending Telegram
      const { getTaxReminders } = await import("@/lib/agent/tax-reminder");
      const report = await getTaxReminders();
      return NextResponse.json({
        dryRun: true,
        report,
        message: "Dry run — no Telegram messages sent",
        sourceStatus: "live",
      });
    }

    const result = await runTaxReminderCheck();
    return NextResponse.json({
      sent: result.sent,
      report: result.report,
      sourceStatus: "live",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Tax reminder check failed", details: String(error) },
      { status: 500 }
    );
  }
}
