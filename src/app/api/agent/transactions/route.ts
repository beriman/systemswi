// GET /api/agent/transactions — Detect and return bank mutations with category suggestions
// POST /api/agent/transactions — Detect + send summary via Telegram
import { NextRequest, NextResponse } from "next/server";
import { detectTransactions, formatTransactionForTelegram, sendTelegramMessage, isTelegramConfigured } from "@/lib/agent";
import { logAgentActionSafe } from "@/lib/agent/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await detectTransactions();
    return NextResponse.json({
      ...result,
      source: "Google Sheets: Rekening_Koran",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to detect transactions", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await detectTransactions();
    let telegramSent = false;

    if (isTelegramConfigured() && result.transactions.length > 0) {
      // Send summary
      const summaryText = `🏦 <b>Transaction Detection Report</b>
📅 ${new Date().toLocaleString("id-ID")}

📊 <b>Summary:</b>
• Total: ${result.transactions.length} transaksi
• Pemasukan: ${result.summary.pemasukan}
• Pengeluaran: ${result.summary.pengeluaran}
• Transfer: ${result.summary.transfer}
• Perlu Review: ${result.summary.needsReview}

${result.transactions
  .filter((t) => t.confidence !== "high")
  .slice(0, 5)
  .map((t) => formatTransactionForTelegram(t))
  .join("\n\n")}`;

      await sendTelegramMessage(summaryText);
      telegramSent = true;
    }

    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "Transaction Detection",
      target: "Rekening_Koran",
      status: "success",
      humanApproved: "n/a",
      notes: `Detected ${result.transactions.length} transactions, ${result.summary.needsReview} need review`,
    });

    return NextResponse.json({
      ...result,
      telegramSent,
      telegramConfigured: isTelegramConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to detect transactions", details: String(error) },
      { status: 500 }
    );
  }
}
